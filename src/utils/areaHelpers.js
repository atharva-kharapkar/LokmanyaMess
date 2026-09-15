/**
 * Extract unique, sorted area names derived STRICTLY from active branch custom areas and active branch customers
 */
export function getUniqueAreas(customers = [], categoryFilter = 'tiffin', customAreas = [], activeBranch = 'All') {
  const areaSet = new Set();
  
  // 1. Customer Areas in current active branch ONLY
  if (Array.isArray(customers)) {
    customers.forEach(c => {
      if (!c) return;
      const matchBranch = !activeBranch || activeBranch === 'All' || (c.branch || 'Branch 1') === activeBranch;
      if (matchBranch && (c.category || '').toLowerCase() === (categoryFilter || 'tiffin').toLowerCase() && c.status !== 'old' && c.status !== 'archived') {
        const clean = String(c.area || '').trim();
        if (clean) areaSet.add(clean);
      }
    });
  }

  // 2. Custom Master Areas matching active branch
  if (Array.isArray(customAreas)) {
    customAreas.forEach(a => {
      if (!a) return;
      if (typeof a === 'string') {
        const clean = a.trim();
        // Plain string custom areas belong to Branch 1
        if (clean && (!activeBranch || activeBranch === 'All' || activeBranch === 'Branch 1')) {
          areaSet.add(clean);
        }
      } else if (typeof a === 'object' && a.name) {
        const clean = String(a.name).trim();
        const itemBranch = a.branch || 'Branch 1';
        if (clean && (!activeBranch || activeBranch === 'All' || activeBranch === itemBranch)) {
          areaSet.add(clean);
        }
      }
    });
  }

  return Array.from(areaSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Add a new area name to the custom master area list in settings for active branch
 */
export async function addCustomArea(db, saveDb, newAreaName, activeBranch = 'Branch 1') {
  const cleanName = String(newAreaName || '').trim();
  if (!cleanName) return false;

  const currentCustomAreas = db.settings?.customAreas || [];
  const targetBranch = activeBranch && activeBranch !== 'All' ? activeBranch : 'Branch 1';
  
  const exists = currentCustomAreas.some(a => {
    const aName = typeof a === 'string' ? a : (a.name || '');
    const aBranch = typeof a === 'string' ? 'Branch 1' : (a.branch || 'Branch 1');
    return aName.toLowerCase() === cleanName.toLowerCase() && aBranch === targetBranch;
  });
  if (exists) return true;

  const newEntry = { name: cleanName, branch: targetBranch };
  const updatedCustomAreas = [...currentCustomAreas, newEntry];

  await saveDb((currentDb) => ({
    ...currentDb,
    settings: {
      ...(currentDb.settings || {}),
      customAreas: updatedCustomAreas
    }
  }));

  return true;
}

/**
 * Permanently delete a custom delivery area from settings and unassign from active branch customers
 */
export async function deleteCustomArea(db, saveDb, areaNameToDelete, activeBranch = 'All') {
  const cleanName = String(areaNameToDelete || '').trim().toLowerCase();
  if (!cleanName) return false;

  const currentCustomAreas = db.settings?.customAreas || [];
  const updatedCustomAreas = currentCustomAreas.filter(a => {
    const aName = (typeof a === 'string' ? a : (a.name || '')).trim().toLowerCase();
    return aName !== cleanName;
  });
  
  await saveDb((currentDb) => ({
    ...currentDb,
    settings: {
      ...(currentDb.settings || {}),
      customAreas: updatedCustomAreas
    },
    customers: (currentDb.customers || []).map(c => {
      if (!c) return c;
      const isCurrentBranch = !activeBranch || activeBranch === 'All' || (c.branch || 'Branch 1') === activeBranch;
      if (isCurrentBranch && String(c.area || '').trim().toLowerCase() === cleanName) {
        return { ...c, area: '' };
      }
      return c;
    })
  }));

  return true;
}

/**
 * Delete ALL custom delivery areas for active branch
 */
export async function deleteAllCustomAreas(db, saveDb, activeBranch = 'All') {
  const currentCustomAreas = db.settings?.customAreas || [];
  let updatedCustomAreas = [];
  if (activeBranch && activeBranch !== 'All') {
    updatedCustomAreas = currentCustomAreas.filter(a => {
      if (typeof a === 'object' && a.branch && a.branch !== activeBranch) return true;
      return false;
    });
  }

  await saveDb((currentDb) => ({
    ...currentDb,
    settings: {
      ...(currentDb.settings || {}),
      customAreas: updatedCustomAreas
    },
    customers: (currentDb.customers || []).map(c => {
      if (!c) return c;
      const isCurrentBranch = !activeBranch || activeBranch === 'All' || (c.branch || 'Branch 1') === activeBranch;
      if (isCurrentBranch) {
        return { ...c, area: '' };
      }
      return c;
    })
  }));

  return true;
}
