import { select } from 'd3-selection';
import { geoPath, geoAlbers } from 'd3-geo';
import { scaleSequential } from 'd3-scale';
import { interpolateSpectral as interpolateViridis } from 'd3-scale-chromatic';
import { feature } from 'topojson-client';
import influxData from '../../data/influx_data.json';
import debounce from 'just-debounce';
import 'd3-jetpack';

// Set constants

const WIDTH = 960;
const ARROW_SIZE = 50;
const CAMPUS_LABEL_LOC = [-73.96155830210468, 40.808667553331034];
const labels = [
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

// Make containers

const svg = select('#map');
const pathContainer = svg.append('g').attr('class', 'features');
const baselineContainer = svg.append('g').attr('class', 'baseline');
const chartContainer = svg.append('g').attr('class', 'slopes');
const textContainer = svg
  .append('g')
  .attr('class', 'text')
  // Create separate groups for white background and black foreground
  .selectAll('g')
  .data([true, false])
  .enter()
  .append('g');

const riverLabel = svg
  .append('text')
  .attr('class', 'river-label')
  .selectAll('tspan')
  .data(['Hudson', 'River'])
  .join('tspan')
  .text(d => d);
const campusLabel = svg
  .append('text')
  .attr('class', 'campus-label')
  .selectAll('tspan')
  .data(['Main', 'Campus'])
  .join('tspan')
  .text(d => d);

const labelContainer = svg.append('g');
const neighborhoodLabelsBg = labelContainer
  .append('g')
  .attr('class', 'neighborhood-labels')
  .selectAll('text')
  .data(labels)
  .enter('text')
  .append('text')
  .attr('class', 'white-background')
  .selectAll('tspan')
  .data(d => d.label)
  .join('tspan')
  .text(d => d);
const neighborhoodLabels = labelContainer
  .append('g')
  .attr('class', 'neighborhood-labels')
  .selectAll('text')
  .data(labels)
  .enter('text')
  .append('text')
  .selectAll('tspan')
  .data(d => d.label)
  .join('tspan')
  .text(d => d);

// Extract census tract features (contains all tracts in Manhattan)

const allTracts = feature(influxData, influxData.objects.tracts);

// Create a separate GeoJSON object that holds only the tracts we want to fit
// the projection around

const tracts = {
  type: 'FeatureCollection',
  features: allTracts.features.filter(({ properties: { census_tract } }) =>
    [36061018900, 36061021900].includes(+census_tract),
  ),
};

// Extract census tract centroids

const centroids = feature(influxData, influxData.objects.tracts_centroids);

// Main function that draws the map

function makeMap() {
  // Create the paths that will become census tracts.
  // The `d` attribute won't be set until the resize function is called.

  const colorScale = scaleSequential(interpolateViridis).domain([-0.5, 0.5]);

  const paths = pathContainer
    .selectAll('path')
    .data(allTracts.features)
    .enter()
    .append('path')
    .classed(
      'columbia-outline',
      d => d.properties.census_tract === '36061020300',
    );

  // Create the things that will become the slope chart (e.g. line, arrow, circles)

  const circles = chartContainer
    .selectAll('circle')
    .data(centroids.features)
    .enter()
    .append('circle')
    .attr('r', 3);

  const baseline = baselineContainer
    .selectAll('line')
    .data(centroids.features)
    .enter()
    .append('line');

  const text = textContainer
    .selectAll('text')
    .data(centroids.features)
    .enter()
    .append('text')
    .classed('white-background', function () {
      return this.parentNode.__data__;
    });

  const slopes = chartContainer
    .selectAll('line')
    .data(centroids.features)
    .enter()
    .append('line')
    .attr('stroke', d =>
      colorScale((d.properties.oct - d.properties.aug) / d.properties.aug),
    )
    .attr('stroke', 'black');

  // Expose a handleResize method that handles the things that depend on
  // width (path generator, paths, and svg)

  return function handleResize() {
    // Recompute width and height; resize the svg

    const width = Math.min(WIDTH, document.documentElement.clientWidth - 30);
    const isMobile = width < 460;
    const height = (width * (isMobile ? 36 : 20)) / 30;
    svg.attr('width', width);
    svg.attr('height', height);

    // Create the projection

    const albersprojection = geoAlbers()
      .rotate([122, 0, 0])
      .fitSize([width, height], tracts);

    // Create the path generating function; set the `d` attribute to the path
    // generator, which is called on the data we attached to the paths earlier

    const pathGenerator = geoPath(albersprojection);
    paths.attr('d', pathGenerator);

    // Define some commonly used coordinate functions

    const x = d => albersprojection(d.geometry.coordinates)[0];
    const y = d => albersprojection(d.geometry.coordinates)[1];
    const endpointX = d => {
      const slope = (d.properties.oct - d.properties.aug) / d.properties.aug;
      const x = ARROW_SIZE * Math.cos(Math.atan(slope * 2));
      return albersprojection(d.geometry.coordinates)[0] + x;
    };
    const endpointY = d => {
      const slope = (d.properties.oct - d.properties.aug) / d.properties.aug;
      const y = ARROW_SIZE * Math.sin(Math.atan(slope) * 2);
      return albersprojection(d.geometry.coordinates)[1] - y;
    };

    // Modify the positions of the elements

    circles.attr('cx', x).attr('cy', y);
    slopes
      .attr('x1', x)
      .attr('y1', y)
      .attr('x2', endpointX)
      .attr('y2', endpointY);

    text
      .attr('x', x)
      .attr('y', y)
      .text(d => {
        let difference =
          (100 * (d.properties.oct - d.properties.aug)) / d.properties.aug;
        difference =
          difference < 10 ? difference.toFixed(1) : Math.round(difference);
        if (difference > 0) return '+' + difference + '%';
        else return '–' + Math.abs(difference) + '%';
      });

    baseline
      .attr('x1', x)
      .attr('y1', y)
      .attr('x2', d => x(d) + ARROW_SIZE)
      .attr('y2', y);

    riverLabel
      .attr('x', isMobile ? 0 : width / 5)
      .attr('y', (_, i) => height / 2 + i * 22);

    campusLabel
      .attr('x', albersprojection(CAMPUS_LABEL_LOC)[0])
      .attr('y', (_, i) => albersprojection(CAMPUS_LABEL_LOC)[1] + i * 18);

    neighborhoodLabels
      .attr('x', function () {
        return albersprojection(this.parentNode.__data__.loc)[0];
      })
      .attr('y', function (_, i) {
        return albersprojection(this.parentNode.__data__.loc)[1] + i * 20;
      });

    neighborhoodLabelsBg
      .attr('x', function () {
        return albersprojection(this.parentNode.__data__.loc)[0];
      })
      .attr('y', function (_, i) {
        return albersprojection(this.parentNode.__data__.loc)[1] + i * 20;
      });
  };
}

// Call big bois

const handleResize = makeMap();
handleResize();
window.addEventListener('resize', debounce(handleResize, 400));
