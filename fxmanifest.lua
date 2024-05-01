fx_version 'cerulean'
name 'QBCore TypeScript Core'
author 'morvix.ts'
game 'gta5'
files { "config.json", "shared.json" }
server_script 'dist/server/**/*.js'
client_script { 'dist/client/**/*.js', 'loops/netevents.lua', 'loops/coreloop.client.lua', 'loops/coreloop2.client.lua' }
shared_scripts { 'shared/locale.lua', 'locale/en.lua' }
