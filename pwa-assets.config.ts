import { defineConfig } from '@vite-pwa/assets-generator';

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']]
    },
    maskable: {
      sizes: [512]
    },
    apple: {
      sizes: [180]
    }
  },
  images: ['public/mask-icon.svg']
});