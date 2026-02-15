export {
    getEnvVar
}

function getEnvVar(varName: string): string | undefined {
    return import.meta.env[`VITE_${varName}`] as string | undefined
}