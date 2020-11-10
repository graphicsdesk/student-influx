import { select } from 'd3-selection';
import { geoPath, geoAlbers } from 'd3-geo';
import { scaleSequential } from 'd3-scale';
import { interpolateSpectral as interpolateViridis } from 'd3-scale-chromatic';
import { feature } from 'topojson-client';
import influxData from '../../data/influx_data.json';
import debounce from 'just-debounce';

// Set constants

const WIDTH = 960;

// Make containers

const svg = select('#map');
const pathContainer = svg.append('g');
const baselineContainer = svg.append('g');
const chartContainer = svg.append('g');

// Extract census tract features (contains all tracts in Manhattan)

const allTracts = feature(influxData, influxData.objects.tracts);

// Create a separate GeoJSON object that holds only the tracts we're interested
// in (useful for focusing the map in on the tracts that we actually care about)

const tracts = {
  type: 'FeatureCollection',
  features: allTracts.features.filter(d => d.properties.aug !== null),
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
    .classed('subdue', d => d.properties.aug === null);

  // Create the things that will become the slope chart (e.g. line, arrow, circles). @char

  const circles = chartContainer
    .selectAll('circle')
    .data(centroids.features)
    .enter()
    .append('circle');

  const baseline = baselineContainer
    .selectAll('line')
    .data(centroids.features)
    .enter()
    .append('line')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5);

  const textBackground = chartContainer
    .append('g')
    .selectAll('text')
    .data(centroids.features)
    .enter()
    .append('text')
    .attr('class', 'white-background');

  const text = chartContainer
    .append('g')
    .selectAll('text')
    .data(centroids.features)
    .enter()
    .append('text');

  const slopes = chartContainer
    .selectAll('line')
    .data(centroids.features)
    .enter()
    .append('line')
    .attr('stroke', d =>
      colorScale((d.properties.oct - d.properties.aug) / d.properties.aug),
    )
    .attr('marker-end', 'url(#map-arrow-open)')
    .attr('stroke-width', 2);

  // Expose a handleResize method that handles the things that depend on
  // width (path generator, paths, and svg)

  return function handleResize() {
    // Recompute width and height
    const width = Math.min(WIDTH, document.documentElement.clientWidth - 30);
    const height = width * (19 / 30);

    // Resize the svg
    svg.attr('width', width);
    svg.attr('height', height);

    // Create the projection. Fit it to the census tracts that we care about
    const albersprojection = geoAlbers()
      .rotate([133, 10, 0])
      .fitSize([width, height], tracts);
    console.log('albersprojection :>> ', albersprojection);
    // Create the path generating function
    const pathGenerator = geoPath(albersprojection);
    // Set the `d` attribute to the path generator, which is called on the data
    // that we attached to the paths earlier
    paths.attr('d', pathGenerator);

    circles
      .attr('cx', d => albersprojection(d.geometry.coordinates)[0])
      .attr('cy', d => albersprojection(d.geometry.coordinates)[1])
      .attr('r', 3);

    const endpointX = d => {
      const slope = (d.properties.oct - d.properties.aug) / d.properties.aug;
      const x = 50 * Math.cos(Math.atan(slope));
      return albersprojection(d.geometry.coordinates)[0] + x;
    };
    const endpointY = d => {
      const slope = (d.properties.oct - d.properties.aug) / d.properties.aug;
      const y = 50 * Math.sin(Math.atan(slope));
      return albersprojection(d.geometry.coordinates)[1] - y;
    };
    slopes
      .attr('x1', d => albersprojection(d.geometry.coordinates)[0])
      .attr('y1', d => albersprojection(d.geometry.coordinates)[1])
      .attr('x2', endpointX)
      .attr('y2', endpointY);

    const arrowLabel = d => {
      let difference =
        (100 * (d.properties.oct - d.properties.aug)) / d.properties.aug;
      difference =
        difference < 10 ? difference.toFixed(1) : Math.round(difference);
      if (difference > 0) return '+' + difference + '%';
      else return '–' + Math.abs(difference) + '%';
    };
    textBackground
      .attr('x', d => albersprojection(d.geometry.coordinates)[0])
      .attr('y', d => albersprojection(d.geometry.coordinates)[1])
      .text(arrowLabel);
    text
      .attr('x', d => albersprojection(d.geometry.coordinates)[0])
      .attr('y', d => albersprojection(d.geometry.coordinates)[1])
      .text(arrowLabel);

    baseline
      .attr('x1', d => albersprojection(d.geometry.coordinates)[0])
      .attr('y1', d => albersprojection(d.geometry.coordinates)[1])
      .attr('x2', d => albersprojection(d.geometry.coordinates)[0] + 50)
      .attr('y2', d => albersprojection(d.geometry.coordinates)[1]);
  };
}

// Call big bois

const handleResize = makeMap();
handleResize();
window.addEventListener('resize', debounce(handleResize, 400));
