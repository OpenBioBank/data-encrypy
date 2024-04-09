const express = require('express')
const { load, DataType, open, close } = require('ffi-rs')
const fileUpload = require('express-fileupload')
const app = express()
const path = require("path")
const port = 3000
const fs = require('fs')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(fileUpload())
app.use('/', express.static(path.join(__dirname, 'uploads')))

function deleteFile (filePath) {
    fs.unlink(filePath, (err) => {  
        if (err) {  
          console.error(`delete file: ${err}`)
        } else {  
          console.log(`${filePath} delete success`)
        }  
      });
}

function saveFileToDisk(filePath, cid) {
    return new Promise((resolve) => {
        const dynamicLib = "./lib/libgene_plugin.so"
        open({
            library: 'libgene_plugin',
            path: dynamicLib
        })
        let input_path = filePath
        let input_ct_path = path.resolve('./uploads/',  `${cid}_input_ct_path.bin`)
        let context_path = path.resolve('./uploads/',  `${cid}_context_path.bin`)
        // let output_ct_path = filePath.slice(0, filePath.length - 4) + '_output_ct_path.bin'
        // let atgc_count = Buffer.alloc(10)
        // let cgCount = Buffer.alloc(10)
    
        const c_encrypt_data = load({
            library: "libgene_plugin",
            funcName: "c_encrypt_data",
            retType: DataType.I32,
            paramsType: [DataType.String, DataType.String, DataType.String],
            paramsValue: [input_path, input_ct_path, context_path]
        })
        console.log(c_encrypt_data)
        // const c_evaluate = load({
        //     library: "libgene_plugin",
        //     funcName: "c_evaluate",
        //     retType: DataType.I32,
        //     paramsType: [DataType.String, DataType.String],
        //     paramsValue: [input_ct_path, output_ct_path]
        // })
        // const c_decrypt_data = load({
        //     library: "libgene_plugin",
        //     funcName: "c_decrypt_data",
        //     retType: DataType.I32,
        //     paramsType: [DataType.String, DataType.String, DataType.U8Array, DataType.U8Array],
        //     paramsValue: [output_ct_path, context_path, cgCount, cgCount]
        // })
        close('libsum')
        deleteFile(filePath)
        resolve()
    })

}

app.post('/upload', (req, res) => {
    console.log('upload=1==>', req.body)
    console.log('upload=2==>', req.files.file)
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('no files found')
    }

    const uploadedFile = req.files.file
    let filePath = path.resolve(__dirname + `/uploads/${Date.now()}` +uploadedFile.name)
    uploadedFile.mv(filePath, (err) => {
        if (err) {
            return res.status(500).send(err)
        }
        saveFileToDisk(filePath, req.body.cid)
        res.send({
            code: 200,
            msg: 'upload success!',
            data: ''
        })
    })
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})


