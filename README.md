# Gwendy's Bitwig shortcuts

Canonical editable catalog: https://docs.google.com/spreadsheets/d/1WP701u03mu5Bp7vQb9I_jW-PdonYqUHcoID3lH8ybUU/edit

Open dist/index.html in a browser, or serve dist with a static file server. No build dependencies.

The default data.js is a snapshot from the Catalog sheet. To refresh your browser, download Catalog as CSV from Sheets and choose Import Sheet CSV. Imports stay in that browser and do not modify the Sheet. To update the hosted default for everyone, replace rows in dist/data.js from the verified Sheet CSV and republish.

CSV columns: ID, Action, Category, Keys, Assignment, Scope, Review, Kind, Notes, Sources. Separate alternate key combinations with semicolons. Keep IDs stable. Empty Keys plus Unassigned means a visible blank mapping; Not visible refers to a collapsed group.

All 25 provided files were inspected, including four repeated views. The catalog covers 781 action rows and nine group headings, starting at File and continuing through General, Editing and the remaining categories to Comping. All nine subgroups are captured. Parent ID links each child action to its group and preserves collapsible nesting on the website. Group headings use Kind=Group and Assignment=Not applicable. Uncertainty is recorded in Review and Notes. Category and action order follows the catalog row order, independent of stable record IDs.

Edit the UI in dist/index.html, styles.css and app.js. catalog-core.js contains filtering and CSV import/export. The site uses no external scripts or analytics.

## Hosting

Connect this repository to Netlify, use main as the production branch, leave the build command empty, and publish the dist directory. netlify.toml records the publish directory. Netlify local state is excluded by .gitignore.
