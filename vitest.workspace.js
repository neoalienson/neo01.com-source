export default [
  {
    root: './components',
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['**/*.test.{js,ts,jsx,tsx}'],
    },
    resolve: {
      alias: [
        { find: /^react$/, replacement: '/home/neo/projects/neo01.com-source/node_modules/react' },
        { find: /^react-dom$/, replacement: '/home/neo/projects/neo01.com-source/node_modules/react-dom' },
        { find: /^react\/jsx-runtime$/, replacement: '/home/neo/projects/neo01.com-source/node_modules/react/jsx-runtime' },
        { find: /^react\/jsx-dev-runtime$/, replacement: '/home/neo/projects/neo01.com-source/node_modules/react/jsx-dev-runtime' },
      ],
    },
  },
];