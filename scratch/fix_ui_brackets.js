const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

const target = `                </div>
              </div>
            </div>
          )}`;

const replacement = `                </div>
              </div>
            </div>
          )
        )}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log('Successfully fixed unmatched parentheses in JSX!');
  fs.writeFileSync(appFile, content, 'utf8');
} else {
  console.error('Target parenthesized block not found!');
}
