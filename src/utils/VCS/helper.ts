import { readFileSync } from 'fs';
import ignore, { Ignore } from 'ignore';



export const getOpenCommitIgnore = (): Ignore => { 
    const ig = ignore();
  
    try {
      ig.add(readFileSync('.opencommitignore').toString().split('\n'));
    } catch (e) {}
  
    return ig;
};