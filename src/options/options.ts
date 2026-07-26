import { load } from './load'
import { saveSettings } from './save-settings'
import { removeToken } from './remove-token'
import { openGithub } from './open-github'

document.getElementById('save')?.addEventListener('click', () => void saveSettings())
document.getElementById('removeToken')?.addEventListener('click', () => void removeToken())
document.getElementById('openGithub')?.addEventListener('click', openGithub)

void load()
