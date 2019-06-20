// Execute in bash =>
// watch "npm run generate-docs" . src/ --filter=./docs/watch-filter.js

module.exports = function filter(f, stat){
	return /README.md$/.test(f) || /fsm.js$/.test(f);
}