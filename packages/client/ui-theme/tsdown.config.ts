import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  import.meta.dirname,
  ['lib/types/index.js'],
  {
    lib: {
      copy: [{
        from: 'src/styles/{brand-font.css,fonts.css,montserrat-*.woff2,google-sans-*.woff2,*-OFL.txt}',
        to: 'lib/styles',
      }],
    },
  },
)
