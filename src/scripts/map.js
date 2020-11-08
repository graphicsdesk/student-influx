import { select } from 'd3-selection';
import censusTracts from '../../data/census_tracts.json';

const div = select('#map-container');
const svg = div.append('svg');

console.log('censusTracts :>> ', censusTracts);

