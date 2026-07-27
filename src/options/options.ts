import { load } from './load'
import { saveSettings } from './save-settings'
import { signIn } from './sign-in'
import { signOut } from './sign-out'
import { openGithub } from './open-github'

document.getElementById('save')?.addEventListener('click', () => void saveSettings())
document.getElementById('signIn')?.addEventListener('click', () => void signIn())
document.getElementById('signOut')?.addEventListener('click', () => void signOut())
document.getElementById('openGithub')?.addEventListener('click', openGithub)

void load()
