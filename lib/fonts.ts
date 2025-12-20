import { Cairo, Baloo_Bhaijaan_2, Zain } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

const balooBhaijaan = Baloo_Bhaijaan_2({
  subsets: ['arabic'],
  weight: ['400', '700', '800'],
  display: 'swap',
});

const zain = Zain({
  subsets: ['arabic'],
  weight: ['200', '300', '400', '700', '800', '900'],
  display: 'swap',
});

export const FONTS = {
  cairo: cairo.className,
  'baloo-bhaijaan': balooBhaijaan.className,
  'zain': zain.className,
};

export const cairoFont = cairo;
export const balooBhaijaanFont = balooBhaijaan;
