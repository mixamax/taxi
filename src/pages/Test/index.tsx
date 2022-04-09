import React, { useRef, useState } from 'react'

export default () => {
  const [files, setFiles] = useState<string[]>([])

  const ref = useRef<HTMLInputElement>(null)

  const handleFilesChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files || [])]
    files.forEach(file => {
      var reader = new FileReader()
      reader.onloadend = function() {
        setFiles(prev => prev.concat(reader.result as string))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSave = () => {
    const open = indexedDB.open('files', 1)
    open.onerror = function(event) {
      console.log('Error loading database')
    }
    open.onupgradeneeded = function(event) {
      var db = open.result
      db.createObjectStore('files')
    }
    open.onsuccess = function(event) {
      const db = open.result
      const name = ref.current?.value.toString() || 'default'
      const transaction = db.transaction('files', 'readwrite')
      const objectStore = transaction.objectStore('files')
      objectStore.put(files.length, `${name}_count`)
      files.forEach((item, index) => {
        objectStore.put(item, `${name}_${index}`)
      })
    }
  }

  const handleLoad = () => {
    const open = indexedDB.open('files', 1)
    open.onerror = function(event) {
      console.log('Error loading database')
    }
    open.onsuccess = function(event) {
      const db = open.result
      const name = ref.current?.value.toString() || 'default'
      const transaction = db.transaction('files', 'readwrite')
      const objectStore = transaction.objectStore('files')
      var count = objectStore.get(`${name}_count`)
      count.onsuccess = function(event) {
        const dbimages = objectStore.getAll(IDBKeyRange.bound(`${name}_0`, `${name}_${count.result.value}`))
        dbimages.onsuccess = function(event) {
          console.log(dbimages.result)
          setFiles(dbimages.result.slice(0, dbimages.result.length - 1) as unknown as string[])
        }
      }
    }
  }

  return (
    <>
      <input type="number" ref={ref}/>
      <button onClick={handleSave}>сохранить</button>
      <button onClick={handleLoad}>загрузить</button><br />
      <input type="file" accept="image/*" multiple onChange={handleFilesChanged}/><br />
      {files.map(item => (<img src={item} key={item} alt="" width="100px" height="100px"/>))}
    </>
  )
}