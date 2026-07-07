const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Reverting App.jsx to clean state...');
  execSync('git checkout src/App.jsx', { stdio: 'inherit' });
  
  console.log('Running implement_features.js...');
  execSync('node scratch/implement_features.js', { stdio: 'inherit' });
  
  console.log('Running implement_ui_features.js...');
  execSync('node scratch/implement_ui_features.js', { stdio: 'inherit' });
  
  console.log('Applying unique bracket fix...');
  const appFile = 'src/App.jsx';
  let content = fs.readFileSync(appFile, 'utf8');
  
  // Use a unique target string that only exists at the end of the Customers registry view
  const uniqueTarget = `                  {filteredCustomers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      {t('noCusts')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}`;

  const uniqueReplacement = `                  {filteredCustomers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      {t('noCusts')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}`;

  if (content.includes(uniqueTarget)) {
    content = content.replace(uniqueTarget, uniqueReplacement);
    fs.writeFileSync(appFile, content, 'utf8');
    console.log('Successfully applied bracket fix uniquely!');
  } else {
    console.error('Error: Unique target not found!');
  }
} catch (err) {
  console.error('Error during revert and apply:', err);
}

