import { GitVCS } from './VCS/git'
import { PerforceVCS } from './VCS/perforce'
import { VCS } from './VCS/VCS'
import { getConfig } from '../commands/config';

export function getVCS(): VCS {
    const config = getConfig();
    const vcsEngine = config?.OCO_VCS_ENGINE;

    if( vcsEngine == 'git'){
        return new GitVCS();
    }
    else if( vcsEngine == 'perforce' ){ 
        return new PerforceVCS(); 
    } 

    return new GitVCS();
} 