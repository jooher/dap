function() {
  'use strict';

  //check for support
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  var dbPromise = idb.open('test-db3', 1, function(upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('people')) {
      upgradeDb.createObjectStore('people', {keyPath: 'email'});
    }
    if (!upgradeDb.objectStoreNames.contains('notes')) {
      upgradeDb.createObjectStore('notes', {autoIncrement: true});
    }
    if (!upgradeDb.objectStoreNames.contains('logs')) {
      upgradeDb.createObjectStore('logs', {keyPath: 'id', autoIncrement: true});
    }
  });
})();