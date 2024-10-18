<!--
 * @Author: hejiahao_tech@163.com hejiahao_tech@163.com
 * @Date: 2024-10-13 16:28:12
 * @LastEditors: hejiahao_tech@163.com hejiahao_tech@163.com
 * @LastEditTime: 2024-10-18 11:14:56
 * @FilePath: \chrome-extensiond:\workSpace\web\Hello-world-Ji-Lu\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script>
import { ElForm, ElFormItem, ElSelect } from 'element-plus';
import { bitable } from '@lark-base-open/js-sdk';
import './index.scss';
import axios from 'axios'
import { ref } from 'vue'

    export default {
        name: 'App',
        data() {
            return {
                formModel: {
                    currentView: null,
                    currentColumnList: [],
                    currentGroups: [],
                    currentRows: [],
                    fileList: []
                },
                currentTable: null,
                columnList: [],
                // 视图列表
                options: [],
                // 分组列表
                groupOptions: [],
                // 整表数据源
                tableInfo: [],
                // 附件选项
                fileOptions: [],
                // 当前列表所有列
                filedIdList: [],
                loading: false,
                tableData: [],
                setFlag: false,
                fieldColumn: [],
                nameCon: 1,
                tableName: '',
                active: 0
            }
        },
        setup () {
            const formModelRef = ref(null)
            return {
                formModelRef
            }
        },
        components: {
            ElForm,
            ElFormItem,
            ElSelect
        },
        created() {
            let _this = this
            ;(async function() {
                const [table,  selection] = await Promise.all([bitable.base.getActiveTable()]);
                const viewList = await table.getViewMetaList()
                _this.tableName = await table.getName()
                // 获取视图列表
                _this.options = viewList.map(item => ({value: item.id, label: item.name}))
                // 默认选择被激活的视图的id
                _this.formModel.currentView = viewList[0].id
                _this.getGroupAndFile()
                // const res = await table.getCellValue(_this.groupOptions[0].id, rowsList[0])
            })()
        },
        mounted() {},
        methods: {
            // 获取当前视图 - 分组，附件列
            async getGroupAndFile () {
                const [table,  selection] = await Promise.all([bitable.base.getActiveTable()]);
                this.loading = true
                let _this = this
                // 获取当前视图
                const currentView = await table.getViewById(_this.formModel.currentView)
                // 获取附件列(有序的)
                const filedList = await currentView.getFieldMetaList()
                _this.filedIdList = filedList
                _this.fileOptions = filedList.map((item, index) => {
                    if (item.type === 17) {
                        return {value: item.id, label: item.name, index: index}
                    }
                }).filter(m => m)
                console.log('fileList', filedList)
                const rowsList = await table.getRecords({pageSize: 500, viewId: _this.formModel.currentView})
                const selectedList = await currentView.getSelectedRecordIdList()
                this.options.forEach(async (item, index) => {
                    let currentView = await table.getViewById(item.value)
                    let selectedList = await currentView.getSelectedRecordIdList()
                    console.log('selectedList' + index, selectedList) 
                })
                console.log('rowsList.records', rowsList.records)
                _this.tableInfo = rowsList.records
                // 定义分组信息列表
                const _groupInfo = []
                // 获取分组信息
                // const _groupList = await currentView.getGroupInfo()
                Promise.all([currentView.getGroupInfo()]).then(res => {
                    if (res) {
                        let _groupList = res[0]
                        _this.tableInfo.forEach((itm, index) => {
                            _groupList.forEach(async item => {
                                let _value = await table.getCellValue(item.fieldId, itm.recordId)
                                if (!_value) return
                                let _text = _value[0]?.text || _value[0]?.name || ''
                                if (_text && !_groupInfo.some(key => key.label.includes(_text))) {
                                    _groupInfo.push({ fieldId: item.fieldId, recordId: itm.recordId, value: item.fieldId + itm.recordId, label: _text })
                                }
                            })
                        })
                        setTimeout(() => {
                        _this.groupOptions = _groupInfo.sort((m, n) => {
                            // 比较两个字符串的每个字符的Unicode编码
                            for (let i = 0; i < m.label.length || i < n.label.length; i++) {
                                // 如果其中一个字符串已经结束，那么另一个字符串就应该排在前面
                                if (m.label[i] === undefined) {
                                    return -1;
                                }
                                if (n.label[i] === undefined) {
                                    return 1;
                                }
                                // 比较当前字符的Unicode编码
                                if (m.label.charCodeAt(i) < n.label.charCodeAt(i)) {
                                    return -1;
                                }
                                if (m.label.charCodeAt(i) > n.label.charCodeAt(i)) {
                                    return 1;
                                }
                            }
                        })
                        this.loading = false
                        }, 1000);
                    }
                })
            },
            currentGroupChange(val) {
                // console.log('123', val)
            },
            // 刷新整个页面
            refresh () {
                location.reload()
                this.$forceUpdate()
            },
            async getGroupData(isGroup = false) {
                let _this = this
                const [table,  selection] = await Promise.all([bitable.base.getActiveTable()]);
                // 获取当前视图
                const currentView = await table.getViewById(_this.formModel.currentView)
                let _currentGroup = this.groupOptions.filter(item => _this.formModel.currentGroups.includes(item.value))
                // 获取分组内部的行
                let rowsList = []
                if (!isGroup) {
                    _currentGroup.forEach(async (itm, idx) => {
                        let _list = this.tableInfo.filter((item, index) => {
                            let _name = item.fields[itm.fieldId]
                            if (_name) {
                                _name = _name[0]?.text || _name[0]?.name
                                return itm.label === _name
                            }
                        })
                        rowsList.push({name: itm.label, list: _list})
                    })
                } else {
                    rowsList.push(
                        {
                            name: this.options.filter(item => item.value === this.formModel.currentView)[0]?.label || '数据表', 
                            list: [...this.tableInfo]
                        }
                    )
                }

                // 获取被选中的数据
                let selectList = await currentView.getSelectedRecordIdList()
                // 获取列表中的所有列
                let filedIdList = JSON.parse(JSON.stringify(this.filedIdList))
                // 根据选中的数据进行过滤，如果没有选中的数据，则取被选中分组的所有数据
                rowsList.forEach(itm => {
                    itm.list = itm.list.filter(item => {
                        if (selectList.length === 0) return true
                        return selectList.includes(item.recordId)
                    })
                })
                let totalLength = 0
                let flag = 0
                rowsList.forEach(n => {
                    totalLength += n.list.length * filedIdList.length
                    n.list.forEach(async (item, index) => {
                        let _obj = []
                        // filedIdList.forEach(async (itm, idx) => {
                        for(let k = 0; k < filedIdList.length; k++) {
                            let itm = filedIdList[k]
                            let idx = k
                            let _val = []
                            try {
                                if (_this.formModel.fileList.includes(itm.id)) {
                                    // 获取附件内容
                                    let _value = await table.getCellValue(itm.id, item.recordId)
                                    // 如果附件列内存在附件地址，则收入到数组中
                                    if (_value && _value.length > 0) {
                                        // ;(async function (){
                                            for(let i = 0; i < _value.length; i++) {
                                                let _item = _value[i]
                                                let _urls = (await table.getCellAttachmentUrls([_item.token], itm.id, item.recordId))
                                                _val.push({url: _urls[0], name: _item.name, type: _item.type, size: _item.size, recordId: item.recordId})
                                            }
                                            flag++
                                            console.log('_val', _val)
                                        // })()
                                    } else {
                                        flag++
                                    }
                                } else if (item.fields && item.fields[itm.id] && item.fields[itm.id] instanceof Array) {
                                    item.fields[itm.id].map(tem => {
                                        _val.push((tem?.text || tem?.name || tem || ' '))
                                    })
                                    _val = _val.join('')
                                    flag++
                                } else if (item.fields && item.fields[itm.id] && item.fields[itm.id] instanceof Object) {
                                    _val.push(item.fields[itm.id]?.value || item.fields[itm.id]?.text || ' ')
                                    _val = _val.join('')
                                    flag++
                                } else {
                                    _val.push(item.fields[itm.id] || ' ')
                                    _val = _val.join('')
                                    flag++
                                }
                            } catch (error) {
                                console.log(error)
                            }
                            _obj[idx] = _val
                            if (idx === filedIdList.length -1) {
                                this.setInfo(n.name, _obj, flag, totalLength)
                            }
                        // })
                        }
                        // this.setInfo(n.name, _obj)

                    })
                })

            },
            // 发送文件目录
            sendInfo (list) {
                // 清洗数据
                let _tableData = JSON.parse(JSON.stringify(this.tableData));
                this.fileOptions.forEach(item => {
                    _tableData.forEach(element => {
                        element.list.forEach(itm => {
                            let _value = itm[item.index]
                            itm[item.index] = (_value || []).map(item => item.url).join()
                        })
                    });
                })
                axios.put('http://localhost:8088/multiTable/getFormData', {
                    tableData: JSON.stringify(_tableData),
                    filedColumn: JSON.stringify(this.filedIdList.map(item => item.name))
                }).then(res => {
                    axios.post('http://localhost:8088/multiTable/assemble', {
                    // axios.post('https://business.mkeke.com/multiTable/multiTable/assemble', {
                        fileList: list,
                        tableName: this.tableName
                    }, {
                        responseType: 'blob'
                    }).then(res => {
                        this.active = 3
                        let file = new Blob([res.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
                        let url = window.URL.createObjectURL(file)
                        let link = document.createElement('a')
                        link.href = url
                        link.setAttribute('download', this.tableName + '.zip')
                        document.body.appendChild(link)
                        link.click()
                        // 清理变量
                        window.URL.revokeObjectURL(url)
                        link.remove()
                        this.loading = false
                        // 下载成功后，重置整个页面
                        this.refresh()
                    }).catch(err => {
                        this.tableData = []
                        this.loading = false
                    })
                })

            },
            comdir () {
                let _nameCon = this.formModel.nameCon
                let submitList = []
                let _tableData = JSON.parse(JSON.stringify(this.tableData))
                // console.log(111, this.tableData, _tableData)
                // 轮询视图行id - (recordId)，并下载附件
                _tableData.forEach(m => {
                    let obj = {
                        name: this.options.filter(item => item.value === this.formModel.currentView)[0]?.label || '数据表',
                        children: []
                    }
                    m.list.forEach( async (item, indexs) => {
                        obj.children[indexs] = {
                            name: m.name,
                            url: []
                        }
                        // 依据所选附件字段，查找附件列的数据在目标数据的索引
                        this.fileOptions.forEach(n => {
                            this.formModel.fileList.forEach(itm => {
                                if (n.value === itm && item[n.index]) {
                                    // obj.children[indexs].url.push(...item[n.index])
                                    ;(item[n.index] || []).forEach(item => {
                                        obj.children[indexs].url.push(item)
                                    })
                                }
                            })
                        })
                        // 判断文件的命名方式
                        // 以字段列名称命名
                        console.log(12, obj.children[indexs].url)

                        if (_nameCon === 2 && obj.children[indexs].url && obj.children[indexs].url.length > 0) {
                            console.log(34, obj.children[indexs].url)

                            obj.children[indexs].url.forEach(key => {
                                // 使用正则表达式匹配文件尾缀
                                let match = key.name.match(/(\.[0-9a-z]+)$/i)
                                if (match) {
                                    match = match[0] || ''
                                }
                                // 置空原文件名称
                                key.name = []

                                // 依据所选字段列，查找字段列的数据在目标数据的索引
                                this.filedIdList.forEach((n, index) => {
                                    this.formModel.fieldColumn.forEach(itm => {
                                        if (n.id === itm && item[index]) {
                                            key.name.push(item[index])
                                        }
                                    })
                                })
                                key.name = key.name.join('-') + (match || '')
                            })
                        }
                    })
                    submitList.push(obj)
                })
                // 发送信息
                this.sendInfo(submitList)
                console.log('submitList', submitList)
            },
            setInfo (name, obj, executeCount, totalCount) {
                let _this = this
                if (this.tableData.length === 0 || !this.tableData.some(item => item.name === name)) {
                    this.tableData.push({
                        name: name,
                        list: [obj]
                    })
                } else {
                    this.tableData.forEach(element => {
                        if (element.name === name) {
                            element.list.push(obj)
                        }
                    });
                }
                console.log(123, executeCount, totalCount)
                if (executeCount !== totalCount) return
                if (this.setFlag) {
                    clearTimeout(this.setFlag)
                }
                // 防止轮询函数未执行完成，而提交数据到后台
                this.setFlag = setTimeout(() => {
                    _this.active = 2
                    _this.comdir()
                }, 2000);
            },
            confirm () {
                console.log('111', this.formModelRef.validate)
                this.formModelRef.validate((valid) => {
                    console.log(valid, 321)
                    if (valid) {
                        this.active = 1
                        this.loading = true
                        console.log('submit')
                        // 如果有分组，则获取分组内的数据
                        if (this.formModel.currentGroups && this.formModel.currentGroups.length > 0) {
                            this.getGroupData()
                        } else {
                            this.getGroupData(true)
                        }
                    } else {
                        console.log('error')
                    }
                })

            }
        }

    }
</script>

<template>
  <main v-loading="loading">
    <el-form 
        :model="formModel"
        label-width="120px"
        label-position="right"
        ref="formModelRef"
    >
        <el-form-item
            label="当前列表:" 
            prop="currentView" 
            :rules="{trigger: 'blur', required: true}"
        >
            <el-select v-model="formModel.currentView" @change="getGroupAndFile">
                <el-option 
                    v-for="(item, index) in options"
                    :key="item.index"
                    :label="item.label"
                    :value="item.value"
                ></el-option>
            </el-select>
        </el-form-item>
        <el-form-item
            v-if="groupOptions.length > 0" 
            label="选择分组:" 
            prop="currentGroups"
            :rules="{trigger: 'blur', required: true, message: '分组必选'}"
        >
            <el-select 
                v-model="formModel.currentGroups"
                multiple
                clearable
                placeholder="请选择"
                @change="currentGroupChange"
            >
                <el-option 
                    v-for="(item, index) in groupOptions"  
                    :key="item.index"
                    :label="item.label"
                    :value="item.value"
                ></el-option>
            </el-select>
        </el-form-item>
        <!-- 文件命名方式 -->
        <el-form-item
            label="文件命名方式:" 
            prop="nameCon"
            :rules="{trigger: 'blur', required: true, message: '文件命名方式必选'}"
        >
            <el-select 
                v-model="formModel.nameCon"
                clearable
                placeholder="请选择"
                @change="currentGroupChange"
            >
                <el-option label="原文件名称" :value="1"></el-option>
                <el-option label="从表字段选择" :value="2"></el-option>
            </el-select>
        </el-form-item>
        <!-- 字段列 -->
        <el-form-item
            v-if="formModel.nameCon === 2"
            label="字段列:" 
            prop="fieldColumn"
            :rules="{trigger: 'blur', required: true, message: '字段列必选'}"
        >
            <el-select 
                v-model="formModel.fieldColumn"
                multiple
                clearable
                placeholder="请选择"
                @change="currentGroupChange"
            >
            <el-option 
                    v-for="(item, index) in filedIdList.filter(item => !([17].includes(item.type)))"
                    :key="item.index"
                    :label="item.name"
                    :value="item.id"
                ></el-option>
            </el-select>
        </el-form-item>
        <!-- 附件列 -->
        <el-form-item
            label="附件字段:" 
            prop="fileList"
            :rules="{trigger: 'blur', required: true, message: '附件字段必选'}"
        >
            <el-select 
                v-model="formModel.fileList"
                multiple
                placeholder="请选择"
            >
                <el-option 
                    v-for="(item, index) in fileOptions"
                    :key="item.index"
                    :label="item.label"
                    :value="item.value"
                ></el-option>
            </el-select>
        </el-form-item>
        <el-form-item label-width="0">
            <el-button type="primary" style="width: 60%" @click="confirm()">下载<el-icon><Download /></el-icon></el-button>
            <el-button type="primary" style="width: 35%" @click="refresh">刷新<el-icon><Refresh /></el-icon></el-button>
        </el-form-item>
     </el-form>
  </main>
  <el-steps class="step-style" :active="active" align-center>
        <el-step title=" " description="获取表格数据"></el-step>
        <el-step title=" " description="上传表格数据"></el-step>
        <el-step title=" " description="数据处理中, 正在下载"></el-step>
    </el-steps>
</template>

<style scoped>
  main {
    padding: 2rem;
    padding-left: 1rem
  }
  h4 {
    font-size: calc(1.275rem + 0.3vw);
    margin-bottom: 1rem;
  }
  code {
    font-size: 0.875em;
    color: #d63384;
    word-wrap: break-word;
  }
  .step-style /deep/ .el-step__main {
    margin-top: 5px;
  }
  .step-style /deep/ .el-step__main .is-finish {
    color: rgb(13, 194, 13) !important;
  }
  .step-style /deep/ .is-finish div {
    color: rgb(13, 194, 13) !important;
    border-color: rgb(13, 194, 13) !important;
  }
</style>
