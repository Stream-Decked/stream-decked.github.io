export default {
  '/streamdecked/': [
    {
      text: 'StreamDecked',
      link: '/streamdecked/',
      items: [
        {
          text: 'For Users',
          collapsed: true,
          items: [
            { text: 'Getting Started', link: '/streamdecked/users/getting-started' }
          ]
        },
        {
          text: 'For Mod Developers',
          collapsed: true,
          items: [
            { text: 'Depending on StreamDecked', link: '/streamdecked/mod-developers/depending' },
            { text: 'Writing a Plugin', link: '/streamdecked/mod-developers/plugin' },
            { text: 'Registering Layouts', link: '/streamdecked/mod-developers/registry' },
            { text: 'Images and Text', link: '/streamdecked/mod-developers/images' },
            { text: 'Events', link: '/streamdecked/mod-developers/events' }
          ]
        }
      ]
    }
  ]
}