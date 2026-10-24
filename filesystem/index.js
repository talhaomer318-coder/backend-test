//         import { Router } from "express";
//         import express from "express";
//         import fs from "fs-extra";
//         import path from "path";
//         import { fileURLToPath } from "url";
//         import {filepath} from "../service.js"

//         const router = Router();

//         const __filename = fileURLToPath(import.meta.url);
//         const __dirname = path.dirname(__filename);

// console.log(__filename);
// console.log(__dirname);

//         router.post("/", async(req,res)=>{
//             try{
//                 const {filename,data,method} = await req.body
//                 const files = filepath(filename)
//                 if(data && data !=""){
//                 if(method == "w"){
//                     fs.writeFile(files,data)
//                 }
//                 }else{
//                     fs.appendFile(file,data)
//                 }
//             }catch(err){
//                 res.send(err)
//             }
//         })

//         router.get("/", (req,res)=>{
//             try{
//                 const {filename} = req.query
//                 const files = filepath(filename)
//             const data = fs.readFile(files)
//             console.log(data)
//             res.send({message:data.tostring()})
//             }catch(err){
//                 res.send(err)   
//             }
            
//         })

      
//         router.post("/", async(req,res)=>{
//             try{
//                 const {filename,data,method} = await req.body
//                 const files = filepath(filename)
//                 console.log(files)
//                 if(data && data !=""){
//                 if(method === "w"){
//                     fs.writeFile(files,data)
//                 }
//                 }else{
//                     fs.appendFile(files,data)
//                 }
//             }catch(err){
//                 res.send(err)
//             }
//         })

//         export default router;