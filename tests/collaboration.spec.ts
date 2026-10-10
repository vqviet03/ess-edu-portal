import {test,expect,type Page} from "@playwright/test";
import {installApiFixture} from "./support/api-fixture";
async function login(page:Page){
 await page.goto("login/");await page.getByLabel("ID học sinh").fill("HV000123");await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
 await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page.getByTestId("lesson-post")).toBeVisible();
}
test("roster displays public IDs, realtime online/offline and visible content receipts without idle HTTP",async({page})=>{
 const fixture=await installApiFixture(page);await page.clock.install();await login(page);
 await page.getByRole("button",{name:"Người đã xem bài viết",exact:true}).click();await expect(page.getByRole("dialog")).toContainText("Chưa có lượt xem.");
 await page.getByRole("button",{name:"Đóng lượt xem",exact:true}).click();
 await page.getByRole("tab",{name:"Thành viên",exact:true}).click();await expect(page.getByText("vq.viet",{exact:false})).toBeVisible();
 fixture.presence({classId:"juniors-03",userId:"teacher-one",connectionId:"teacher-tab",online:true,seenAt:new Date().toISOString()});
 await expect(page.getByText("Đang online",{exact:true})).toBeVisible();
 fixture.presence({classId:"juniors-03",userId:"teacher-one",connectionId:"teacher-tab",online:false,seenAt:new Date().toISOString()});
 await expect(page.getByText("Vừa offline",{exact:true})).toBeVisible();
 let reads=0;page.on("request",r=>{if(r.url().includes("/v1/"))reads++;});
 await page.clock.fastForward(120000);expect(reads).toBe(0);
});
test("important online notice stays until X dismissal and does not silently mark read",async({page})=>{
 const fixture=await installApiFixture(page);await page.clock.install();await login(page);
 fixture.notify({id:"important-day",type:"SCHEDULE",title:"Thông báo nghỉ học: Thứ Hai, 02/11/2026",href:"/class/?classId=juniors-03&tab=attendance",isRead:false,version:1,priority:"IMPORTANT",createdAt:new Date().toISOString()});
 const toast=page.getByRole("alert").filter({hasText:"Thông báo nghỉ học"});
 await expect(toast).toBeVisible();await page.clock.fastForward(30000);await expect(toast).toBeVisible();
 await page.getByRole("button",{name:"Đóng thông báo",exact:true}).click();await expect(toast).not.toBeVisible();
 await expect(page.getByRole("link",{name:"Thông báo (1 chưa đọc)"})).toBeVisible();
});
