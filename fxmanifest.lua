fx_version 'cerulean'
name 'QBCore TypeScript Core'
author 'soulkeeper.tsx (Team BroCode)'
game 'gta5'
files { "config.json", "shared.json" }
server_script 'dist/server/**/*.js'
client_script { 'dist/client/**/*.js', 'loops/netevents.lua', 'loops/coreloop.client.lua', 'loops/coreloop2.client.lua' }
shared_scripts { 'shared/locale.lua', 'locale/en.lua' }


--[[ Thanks to Porject Error for FiveM TypeScript Boilerplate
https://github.com/project-error/fivem-typescript-boilerplate ]]
