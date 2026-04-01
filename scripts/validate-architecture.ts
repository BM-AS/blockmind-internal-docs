import architectureModel from '../content/data/architecture.json';
import { parseC4Model } from '../components/c4-viewer/schema';

const model = parseC4Model(architectureModel);

console.log('=== Validating architecture.json ===');
console.log(`Elements: ${Object.keys(model.elements).length}`);
console.log(`Containment entries: ${model.containment.length}`);
console.log(`Relationships: ${Object.keys(model.relationships).length}`);
console.log(`Views: ${Object.keys(model.views).length}`);
console.log('✅ architecture.json is valid');
