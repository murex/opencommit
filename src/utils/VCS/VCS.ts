import { execa, ExecaReturnValue } from 'execa'

export interface VCS{
 
    assertVCS(): Promise<void>;
    
    getFilesToCommit(): Promise<string[]>; 

    getChangedFiles(): Promise<string[]>; 

    isolateChanges({ files }: { files: string[] }): Promise<void>;

    getDiff({ files }: { files: string[] }): Promise<string>;

    commitAndPush(commitMessage: string, extraArgs: string[]): Promise<void>;

} 
