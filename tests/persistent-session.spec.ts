import {test,expect} from "@playwright/test";
import {installApiFixture} from "./support/api-fixture";
const base=process.env.NEXT_PUBLIC_BASE_PATH??"";
test("closing a tab preserves login; opening another validates once and logout clears other tabs",async({page,context})=>{
 const sessions=new Map<string,string>();
 await installApiFixture(page,{sessions});
 await page.goto(`${base}/login/`);await page.getByLabel("ID học sinh").fill("HV000123");await page.locator('input[autocomplete="current-password"]').fill("Demo123!");await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/home\//);
 expect(await page.evaluate(()=>localStorage.getItem("learnleaf.session")!==null)).toBe(true);expect(await page.evaluate(()=>sessionStorage.getItem("learnleaf.session"))).toBeNull();
 await page.close();const other=await context.newPage();await installApiFixture(other,{sessions});
 let meReads=0;other.on("request",r=>{if(r.method()==="GET"&&new URL(r.url()).pathname.endsWith("/me"))meReads++;});
 await other.goto(`${base}/home/`);await expect(other.getByRole("button",{name:"Giao diện",exact:true})).toBeVisible();await expect(other.locator("main")).toBeVisible();await expect.poll(()=>meReads).toBe(1);await expect(other).toHaveURL(/home\//);
 const observer=await context.newPage();await installApiFixture(observer,{sessions}); await observer.goto(`${base}/home/`);await expect(observer.locator("main")).toBeVisible();await expect(observer).toHaveURL(/home\//);
 await other.getByRole("button",{name:"Tài khoản",exact:true}).click();await other.getByRole("menuitem",{name:"Đăng xuất",exact:true}).click();
 await expect(other).toHaveURL(/login\//);await expect(observer).toHaveURL(/login\//);expect(await observer.evaluate(()=>localStorage.getItem("learnleaf.session"))).toBeNull();
});
