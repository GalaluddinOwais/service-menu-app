import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, username, password, plan } = body;

        if (!name || !username || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Validate plan if provided
        const validPlans = ['free', 'basic', 'pro', 'business'];
        const selectedPlan = plan && validPlans.includes(plan) ? plan : 'free';

        // Hash the password before saving
        const hashedPassword = await hashPassword(password);

        const newAdmin = await createAdmin({
            name,
            username,
            password: hashedPassword,
            theme: 'ocean',
            cardStyle: 'rounded',
            plan: 'free',
            isAcceptingOrders: false,
            isAcceptingOrdersViaWhatsapp: false,
            isAcceptingTableOrders: false,
            enableDeliveryEmployees: false,
            enableWaiters: false,
            defaultDeliveryAssignment: '',
        });

        // Create session token for auto-login
        const sessionToken = createSessionToken(newAdmin.id, newAdmin.username, 'admin');

        // Return the new admin data (without password) and the token
        const { password: _, ...sanitizedAdmin } = newAdmin;

        return NextResponse.json({
            ...sanitizedAdmin,
            sessionToken
        }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/register:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to register',
        }, { status: 500 });
    }
}
