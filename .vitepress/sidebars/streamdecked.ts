export default {
  '/sd5j/': [
    {
      text: 'SD5J',
      link: '/sd5j/',
      items: [
        { text: 'Overview', link: '/sd5j/' },
        { text: 'Connecting', link: '/sd5j/connecting' },
        { text: 'Deck Model', link: '/sd5j/model' },
        { text: 'Surfaces and Buttons', link: '/sd5j/surfaces' },
        { text: 'Events', link: '/sd5j/events' },
        { text: 'Images', link: '/sd5j/images' }
      ]
    }
  ],
  '/streamdecked/': [
    {
      text: 'StreamDecked',
      link: '/streamdecked/',
      items: [
        {
          text: 'For Users',
          collapsed: true,
          items: [
            { text: 'Getting Started', link: '/streamdecked/users/getting-started' },
            { text: 'How It Works', link: '/streamdecked/how-it-works' }
          ]
        },
        {
          text: 'For Mod Developers',
          collapsed: true,
          items: [
            { text: 'The SD5J Library', link: '/sd5j/' },
            { text: 'Depending on StreamDecked', link: '/streamdecked/mod-developers/depending' },
            { text: 'Writing a Plugin', link: '/streamdecked/mod-developers/plugin' },
            { text: 'Example Plugin', link: '/streamdecked/mod-developers/example' },
            { text: 'Registering Layouts', link: '/streamdecked/mod-developers/registry' },
            { text: 'Images and Text', link: '/streamdecked/mod-developers/images' },
            { text: 'Events', link: '/streamdecked/mod-developers/events' }
          ]
        }
      ]
    }
  ]
}