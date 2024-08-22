import { execa, ExecaReturnValue } from "execa"
import { VCS } from "./VCS"
import { getOpenCommitIgnore } from './helper';
import { outro } from '@clack/prompts';
import chalk from 'chalk';


export class PerforceVCS implements VCS {
     
    async assertVCS(): Promise<void> {
        try {
            await execa('p4', ['info']);
        } catch (error) {
            throw new Error(`Failed to connect to Perforce workspace: ${(error as any).message}`);
        }
    }

    async getFilesToCommit(): Promise<string[]> {
        try {   
            const { stdout: files } = await execa('p4', ['diff', '-sa']);  

            if (!files) return [];
            const filesList = files.split('\n');

            try{
                const ig = getOpenCommitIgnore();
                const allowedFiles = filesList.filter((file) => !ig.ignores(file));
                if (!allowedFiles) return [];
                return allowedFiles.sort();
            }
            catch(e){
                return filesList.sort();
            }

        } catch (error) {

            throw new Error(`Failed to get changed files: ${error.message}`);

        }
    }

    async  getChangedFiles() : Promise<string[]> { 
        return [];
    };

    async isolateChanges( { files }: { files: string[] } ): Promise<void> { 
        return;
    }            
        
    async getDiff( { files }: { files: string[] } ): Promise<string> {
        const lockFiles = files.filter(
            (file) =>
              file.includes('.lock') ||
              file.includes('-lock.') ||
              file.includes('.svg') ||
              file.includes('.png') ||
              file.includes('.jpg') ||
              file.includes('.jpeg') ||
              file.includes('.webp') ||
              file.includes('.gif')
        );
        if (lockFiles.length) {
            outro(
              `Some files are excluded by default from 'git diff'. No commit messages are generated for this files:\n${lockFiles.join(
                '\n'
              )}`
            );
        }
        const filesWithoutLocks = files.filter(
            (file) => !file.includes('.lock') && !file.includes('-lock.')
        );

        const { stdout: diff } = await execa('p4', [
            'diff',
            '-du',
            ...filesWithoutLocks
        ])

        return diff;
    }

    async commitAndPush( commitMessage: string, extraArgs: string[] ): Promise<void> {
        const { stdout } = await execa('p4', [
            'submit',
            '-d',
            commitMessage,
            ...extraArgs
        ]);
        outro(`${chalk.green('✔')} Successfully committed`);
        outro(stdout);

    }   

}


