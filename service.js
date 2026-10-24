    import {cwd} from "process";
    import fs from "fs-extra";
import path from "path";

export async function filepath(filename){
    const folder = path.join(cwd(),"assests","file")
   await fs.mkdir(folder,{recursive:true})
    const filepath =  path.join(folder,filename)
    return filepath;
}