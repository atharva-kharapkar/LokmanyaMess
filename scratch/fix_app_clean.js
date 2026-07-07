const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Fix the dashboard tab block (first occurrence of the corrupted pattern)
const badDashboardTarget = `                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}`;

const goodDashboardReplacement = `                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}`;

if (content.includes(badDashboardTarget)) {
  content = content.replace(badDashboardTarget, goodDashboardReplacement);
  console.log('Restored dashboard brackets back to normal!');
}

// 2. Uniquely fix the customers tab block
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
  console.log('Uniquely fixed the customers tab brackets!');
} else {
  console.log('Customers tab target not found (might already be fixed or template mismatch).');
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Finished bracket fixes.');

