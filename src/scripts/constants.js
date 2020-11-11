// Colors of different arrows and lines

export const c20 = 'rgb(24, 125, 131)';
export const c19 = 'rgb(132, 185, 216)';

export const baselineColor = '#ababab';

// <defs> for SVG

export const DEFS = `<defs>
  <marker
    id="map-arrow-20"
    refX="4"
    refY="2.5"
    markerWidth="20"
    markerHeight="20"
    orient="auto-start-reverse"
  >
    <path d="M 0 0 5 2.5 0 5 0 2.5" fill="${c20}"></path>
  </marker>
  <marker
    id="map-arrow-19"
    refX="4"
    refY="2.5"
    markerWidth="20"
    markerHeight="20"
    orient="auto-start-reverse"
  >
    <path d="M 0 0 5 2.5 0 5 0 2.5" fill="${c19}"></path>
  </marker>
  <marker
    id="map-arrow-black"
    refX="4"
    refY="2.5"
    markerWidth="20"
    markerHeight="20"
    orient="auto-start-reverse"
  >
    <path d="M 0 0 5 2.5 0 5 0 2.5" fill="#121212"></path>
  </marker>
</defs>`;

// Neighborhood labels

export const LABELS = [
  {
    label: ['Morningside', 'Heights'],
    loc: [-73.96653530947926, 40.805711419929914],
  },
  { label: ['Manhattanville'], loc: [-73.95314645865469, 40.81456772136083] },
  {
    label: ['Central', 'Harlem South'],
    loc: [-73.95252558449528, 40.80322310573006],
  },
];

// Campus label geolocation

export const CAMPUS_LABEL_LOC = [-73.96155830210468, 40.808667553331034];
