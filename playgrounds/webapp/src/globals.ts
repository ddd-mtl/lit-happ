/** -- HC_APP_PORT & friends -- */

export let HC_APP_PORT: number | undefined = undefined;
export let HC_ADMIN_PORT: number | undefined = undefined;
try {
  HC_APP_PORT = Number(process.env.HC_APP_PORT);
  HC_ADMIN_PORT = Number(process.env.HC_ADMIN_PORT);
} catch (e:any) {
  console.log("HC_APP_PORT not defined")
}

//console.log("HAPP_ID =", DEFAULT_FILES_DEF.id)
console.log("HC_APP_PORT =", HC_APP_PORT);
console.log("HC_ADMIN_PORT =", HC_ADMIN_PORT);
