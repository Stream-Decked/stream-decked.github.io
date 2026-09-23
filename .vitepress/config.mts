import { defineConfig } from 'vitepress'
import streamdecked from './sidebars/streamdecked.ts'

export default defineConfig({
  lastUpdated: true,
  srcDir: 'src',

  ignoreDeadLinks: true,
  cleanUrls: true,

  title: 'StreamDecked',
  description: 'Less keybinds, more buttons.',

  // Replace with the real logo once the icon lands.
  head: [
    // ['link', { rel: 'icon', href: '/assets/streamdecked-icon.webp' }],
  ],

  themeConfig: {
    // logo: {
    //   src: '/assets/streamdecked-icon.webp',
    //   width: 24,
    //   height: 24
    // },

    search: {
      provider: 'local'
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'SD5J', link: '/sd5j/' }
    ],

    sidebar: {
      ...streamdecked
    }
  }
})
