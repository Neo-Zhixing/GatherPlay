export class Key {
  constructor () {
    this.value = null
  }
  get () {
    return this.value
  }
  set (value) {
    this.value = value
  }
  delete () {
    this.value = null
  }
}

export class Cache {
  constructor (item, ttl) {
    this.itemContainer = item
    this.ttlContainer = ttl
  }
  set (value, timeout) {
    this.itemContainer.set(value)
    if (timeout) this.touch(timeout)
  }
  get () {
    if (this.ttl() === null) {
      this.flush()
      return null
    }
    return this.itemContainer.get()
  }
  touch (timeout) {
    const t = Math.round(Date.now() / 1000 + timeout)
    this.ttlContainer.set(t)
  }
  ttl () {
    let ttl = this.ttlContainer.get()
    if (!ttl) return null
    ttl = ttl - Date.now() / 1000
    if (ttl < 0) {
      this.flush()
      return null
    }
    return ttl
  }
  flush () {
    this.itemContainer.delete()
    this.ttlContainer.delete()
  }
}

class StorageKey {
  constructor (key, storage=window.localStorage) {
    this.key = key
    this.storage = storage
  }
  get () {
    return this.storage.getItem(this.key)
  }
  set (value) {
    this.storage.setItem(this.key, value)
  }
  delete () {
    this.storage.deleteItem(this.key)
  }
}
export class StorageCache extends Cache {
  static CacheTimeoutPrefix = '_cache_timeout_'
  constructor (key, storage = window.localStorage, prefix) {
    if (!prefix) prefix = StorageCache.CacheTimeoutPrefix
    super(new StorageKey(key), new StorageKey(prefix + key))
  }
}


export class VuexStoreKey extends Key {
  constructor (store, key, commitKey) {
    super()
    this.store = store
    this.key = key
    this.commitKey = commitKey
  }
  get value () {
    if (!this.store) return null
    const path = this.key.split('/')
    let value = this.store.state
    path.forEach(pathSeg => {
      value = value[pathSeg]
    })
    return value
  }
  set value (value) {
    if (this.store) this.store.commit(this.commitKey, value)
  }
}
export class VuexStoreCache extends Cache {
  constructor (store, itemKey, ttlKey, itemCommitKey, ttlCommitKey) {
    if (!itemCommitKey) itemCommitKey = itemKey + 'Update'
    if (!ttlCommitKey) ttlCommitKey = ttlKey + 'Update'
    super(new VuexStoreKey(store, itemKey, itemCommitKey), new VuexStoreKey(store, ttlKey, ttlCommitKey))
  }
}
