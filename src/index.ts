/*
 * @Author: hejiahao_tech@163.com hejiahao_tech@163.com
 * @Date: 2024-09-27 15:59:19
 * @LastEditors: hejiahao_tech@163.com hejiahao_tech@163.com
 * @LastEditTime: 2024-10-12 18:09:51
 * @FilePath: \Hello-world-Ji-Lu\src\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import $ from 'jquery';
import { bitable } from '@lark-base-open/js-sdk';
import './index.scss';
import axios from 'axios'

let options:any = []
let tableName:string = ''

// 发送附件对象
function sendFileObj (options:any) {
  let _options:any = []
  options.forEach((item:any) => {
    if (!item.parentRecordName) {
      _options.push(item)
    }
  })

  let _sendOptions = JSON.stringify(_options, (key, value) => {
    // console.log('key', key, value)
    return value
  })
  
  axios.post('http://localhost:8088/multiTable/assemble', {
    fileList: _sendOptions,
    tableName: tableName
  }, {
    responseType: 'blob'
  }).then(res => {
    // console.log(res, 'res')
    let file = new Blob([res.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
    let url = window.URL.createObjectURL(file)
    let link = document.createElement('a')
    link.href = url
    link.setAttribute('download', tableName + '.zip')
    document.body.appendChild(link)
    link.click()
    // 清理变量
    window.URL.revokeObjectURL(url)
    link.remove()
    $('#dialog')[0].style.cssText = 'display: none'
  })
}

$(async function() {
  const [tableList, table1,  selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getActiveTable(), bitable.base.getSelection()]);
  (await table1.getFieldList()).map(async (item:any, index:number) => {
    let name = await item.getName()
    options.push(`<option value=${item.id}>${name}</option>`)
    if (index === (await table1.getFieldList()).length - 1) {
      $('#tableSelect2').append(options)
    }
  })
  const optionsHtml = tableList.map(table => {  
    return `<option value="${table.id}">${table.name}</option>`;
  }).join('');

  $('#tableSelect').append(optionsHtml).val(selection.tableId!);
  $('#addRecord').on('click', async function() {
    // 获取父记录列Id
    let parentRecordId:string = ''
    let filePath = []
    // const tableId = $('#tableSelect').val();
    tableList.forEach(item => {
      if (item.id === selection.tableId) {
        tableName = item.name
      }
    })
    // 获取文件名id
    const columnName:any =$('#tableSelect2').val();

    if (selection.tableId) {
      // 获取有序record记录
      const table2 = await bitable.base.getTableById(selection.tableId!)
      const viewMetaList:any = await table2.getViewMetaList()
      const view = await table2.getViewById(viewMetaList[0].id)
      const viewList = await view.getVisibleRecordIdList()
      const FieldList = await table1.getFieldList()

      // 获取附件列
      let fileId:any = FieldList.filter((item:any) => {
        if (item.type === 17) {
          return true
        }
        if (item.type === 18) {
          parentRecordId = item.id
        }
        return false
      })
      // 获取列id - 附件, 如果附件列不存在，则终止操作
      if (!(fileId && fileId.length > 0)) {
        return
      }
      type objType = {
        name: any,
        nameId: string,
        value: any,
        valueId: string,
        token?: any,
        url: any,
        fileName?: any,
        parentRecordName: any,
        children:any
      }
      options = []
      let setFlag:any = ''
      let map = new Map()
      // 轮询视图行id - (recordId)，并下载附件
      viewList.forEach( async (item:any, indexs:number) => {
          let obj:objType = {
            name: '',
            nameId: '',
            value: [],
            valueId: '',
            token: [],
            url: [],
            fileName: [],
            parentRecordName: '',
            children: []
          }
          // 获取当前行对象
          obj.name = (await table1.getCellValue(columnName, item))
          console.log('112233', obj.name)

          if (parentRecordId) {
            obj.parentRecordName = (await table1.getCellValue(parentRecordId, item))
            obj.parentRecordName = obj.parentRecordName?.text || ''
          }
          if (obj.name && obj.name instanceof Array) {
            obj.name = obj.name[0]?.name || obj.name[0]?.text
          } else {
            obj.name = obj.name?.name || obj.name?.text
          }
          fileId.forEach(async (key:any, index:number) => {
            obj.valueId = key.id
            let _vlaue:any = await table1.getCellValue(key.id, item)
            if (_vlaue) {
              obj.value = _vlaue.concat(obj.value)
            }
            

            if (obj.value && obj.value.length > 0) {
              obj.value.forEach( async (m:any, idx:any) => {
                obj.token.push(m.token)
                let _urlList = (await table1.getCellAttachmentUrls([m.token], key.id, item))
                _urlList.forEach(item => {
                  obj.url.push(item)
                })
                if (idx === obj.value.length - 1 && indexs === viewList.length - 1) {
                  if (setFlag) {
                    clearTimeout(setFlag)
                  } else {
                    setFlag = setTimeout(() => {
                      sendFileObj(options)
                    }, 1000);
                  }
                }
              })
              options.push(obj)
              if (!map.get(obj.name)) {
                map.set(obj.name, obj)
              }
              options.forEach((m:any, index:number) => {
                if (m.parentRecordName) {
                  let obj = map.get(m.parentRecordName)
                  // 将子节点放入到父节点中
                  if (obj) {
                    obj.children.push(m)
                  }
                }
              });
              // if (setFlag) {
              //   clearTimeout(setFlag)
              // }
              $('#dialog')[0].style.cssText = 'display: block'
              console.log('******************')
              // setFlag = setTimeout(() => {
              // }, 10000);
            } else {
              if (indexs === viewList.length - 1) {
                if (setFlag) {
                  clearTimeout(setFlag)
                } else {
                  setFlag = setTimeout(() => {
                    sendFileObj(options)
                  }, 1000);
                }
              }
            }
          })

      })
    }
  });
});