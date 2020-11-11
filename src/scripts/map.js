import { select } from 'd3-selection';
import { geoPath, geoAlbers } from 'd3-geo';
import { feature } from 'topojson-client';
import { DEFS, LABELS, CAMPUS_LABEL_LOC, c20, c19, shadedColor } from './constants';
import influxData2020 from '../../data/2020-influx_data.json';
import influxData2019 from '../../data/2019-influx_data.json';
import debounce from 'just-debounce';

// Set constants

const WIDTH = 780;
const mapsContainer = select('#maps-container');
let arrowSize;

// Main function that draws the map

function makeMap() {
  // Make containers

  const div = mapsContainer.append('div').attr('class', 'map-container');
  const svg = div.append('svg').html(DEFS);

  const pathContainer = svg.append('g').attr('class', 'features');
  const baselineContainer = svg.append('g').attr('class', 'baseline');
  const chart19Container = svg.append('g').attr('class', 'slopes-19');
  const chart20Container = svg.append('g').attr('class', 'slopes-20');
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
    .append('g')
    .attr('class', 'campus-labels')
    // Create separate groups for white background and black foreground
    .selectAll('text')
    .data([true, false])
    .enter()
    .append('text')
    .classed('white-background', d => d)
    .selectAll('tspan')
    .data(['Main', 'Campus'])
    .join('tspan')
    .text(d => d);

  const labelContainer = svg.append('g');
  const neighborhoodLabelsBg = labelContainer
    .append('g')
    .attr('class', 'neighborhood-labels')
    .selectAll('text')
    .data(LABELS)
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
    .data(LABELS)
    .enter('text')
    .append('text')
    .selectAll('tspan')
    .data(d => d.label)
    .join('tspan')
    .text(d => d);

  // Extract census tract features (contains all tracts in Manhattan)

  const allTracts2020 = feature(influxData2020, influxData2020.objects.tracts);

  // Create a separate GeoJSON object that holds only the tracts we want to fit
  // the projection around

  const tracts = {
    type: 'FeatureCollection',
    features: allTracts2020.features.filter(
      ({ properties: { census_tract } }) =>
        [36061018900, 36061021900].includes(+census_tract),
    ),
  };

  // Extract census tract centroids

  const centroids2020 = feature(
    influxData2020,
    influxData2020.objects.tracts_centroids,
  );
  const centroids2019 = feature(
    influxData2019,
    influxData2019.objects.tracts_centroids,
  );

  // Create the paths that will become census tracts.
  // The `d` attribute won't be set until the resize function is called.

  const paths = pathContainer
    .selectAll('path')
    .data(allTracts2020.features)
    .enter()
    .append('path')
    .classed(
      'columbia-outline',
      d => d.properties.census_tract === '36061020300',
    );

  // Create the things that will become the slope chart (e.g. line, arrow, circles)

  const circles = chart20Container
    .selectAll('circle')
    .data(centroids2020.features)
    .enter()
    .append('circle')
    .attr('r', 3);

  const baseline = baselineContainer
    .selectAll('line')
    .data(centroids2020.features)
    .enter()
    .append('line');

  const text = textContainer
    .selectAll('text')
    .data(centroids2020.features)
    .enter()
    .append('text')
    .classed('white-background', function () {
      return this.parentNode.__data__;
    });

  const slopes2020 = chart20Container
    .selectAll('line')
    .data(centroids2020.features)
    .enter()
    .append('line')
    .attr('stroke', c20);

  const slopes2019 = chart19Container
    .selectAll('line')
    .data(centroids2019.features)
    .enter()
    .append('line')
    .attr('stroke', c19);

  // Make a handleResize method that handles the things that depend on
  // width (path generator, paths, and svg)

  function handleResize() {
    // Recompute width and height; resize the svg

    const width = Math.min(WIDTH, document.documentElement.clientWidth - 30);
    const isMobile = width < 460;
    const height = (width * (isMobile ? 36 : 29)) / 30;
    arrowSize = isMobile ? 32 : 45;
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
      const x = arrowSize * Math.cos(Math.atan(slope * 2));
      return albersprojection(d.geometry.coordinates)[0] + x;
    };
    const endpointY = d => {
      const slope = (d.properties.oct - d.properties.aug) / d.properties.aug;
      const y = arrowSize * Math.sin(Math.atan(slope) * 2);
      return albersprojection(d.geometry.coordinates)[1] - y;
    };

    // Modify the positions of the elements

    circles.attr('cx', x).attr('cy', y);
    slopes2020
      .attr('x1', x)
      .attr('y1', y)
      .attr('x2', endpointX)
      .attr('y2', endpointY);
    slopes2019
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
      .attr('x2', d => x(d) + arrowSize)
      .attr('y2', y);

    riverLabel
      .attr('x', isMobile ? 0 : width / 6)
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
  }

  // Call the resize function once; attach it to a resize listener

  handleResize();
  window.addEventListener('resize', debounce(handleResize, 400));
}

// Call the big fn

makeMap();

const mapTitle = select('p.map-title');
mapTitle.html(
  mapTitle
    .html()
    .replace('2020', `<span style="color: ${c20}">2020</span>`)
    .replace('2019', `<span style="color: ${c19}">2019</span>`)
    .replace('<b>', `<b style="background-color: ${shadedColor}">`),
);
