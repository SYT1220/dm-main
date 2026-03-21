var contentDormitoryData;
var editContentDormitoryData;

/**
 * 宿舍管理导航
 */
function dormitoryNav() {
    navSelected('#dormitoryNavItem');
    contentHeadShow('.dormitoryContentHead');
    clearContentTable();
    initDormitory();
}

/**
 * 宿舍导航初始化
 */
function initDormitory() {
    var columns = [{
        field: 'sn',
        title: '宿舍编号',
        align: 'left',
        valign: 'left'
    }, {
        field: 'buildingName',
        title: '所属楼宇',
        align: 'left',
        valign: 'left'
    }, {
        field: 'floor',
        title: '所属楼层',
        align: 'center',
        valign: 'middle'
    }, {
        field: 'maxNumber',
        title: '最大可住人数',
        align: 'center',
        valign: 'middle'
    }, {
        field: 'livedNumber',
        title: '已住人数',
        align: 'center',
        valign: 'middle'
    }, {
        field: 'dormitoryManagerName',
        title: '辅导员',
        align: 'left',
        valign: 'middle'
    }];
    
    // 学生用户登录 (loginType='3')，不显示操作列
    if (loginType !== '3') {
        columns.push({
            field: 'id',
            title: '操作',
            align: 'center',
            valign: 'middle',
            formatter: dormitoryFormatter
        });
    }
    
    $('#contentData').bootstrapTable({
        data: contentDormitoryData,
        dataType: 'json',
        pagination: true,
        pageSize: 5,
        striped: true,
        search: false,
        singleSelect: false,
        showHeader: true,
        showFooter: false,
        showColumns: false,
        showRefresh: false,
        showToggle: false,
        sortable: false,
        columns: columns
    });
    initDormitoryData();
}

function initDormitoryData() {
    $.ajax({
        async: false,
        cache: false,
        type: 'GET',
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/dormitory',
        success: function (data) {
            contentDormitoryData = data._embedded.dormitory;
            addBuildingData(contentDormitoryData);
        },
        error: function (data) {
        }
    });
}

function addBuildingData(contentDormitoryData){
    $.ajax({
        async: false,
        cache: false,
        type: 'GET',
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/building',
        success: function (data) {
            var buildingData = data._embedded.building;
            // 获取辅导员数据
            $.ajax({
                async: false,
                cache: false,
                type: 'GET',
                datType: "json",
                accept: "application/json;charset=UTF-8",
                contentType: "application/json;charset=UTF-8",
                url: '/dormitoryManager',
                success: function (managerData) {
                    var dormitoryManagerData = managerData._embedded.dormitoryManager;
                    for (var i = 0; i < contentDormitoryData.length; i++) {
                        // 查找宿舍对应的楼宇
                        for (var j = 0; j < buildingData.length; j++) {
                            if (contentDormitoryData[i].buildingId === buildingData[j].id) {
                                contentDormitoryData[i].buildingName = buildingData[j].name;
                                // 查找楼宇对应的辅导员
                                if (buildingData[j].dormitoryManagerId) {
                                    for (var k = 0; k < dormitoryManagerData.length; k++) {
                                        if (buildingData[j].dormitoryManagerId === dormitoryManagerData[k].id) {
                                            contentDormitoryData[i].dormitoryManagerName = dormitoryManagerData[k].name;
                                            break;
                                        }
                                    }
                                }
                                if (!contentDormitoryData[i].dormitoryManagerName) {
                                    contentDormitoryData[i].dormitoryManagerName = '未分配';
                                }
                                break;
                            }
                        }
                    }
                    var table = $('#contentData');
                    table.bootstrapTable('refreshOptions', {data: contentDormitoryData, dataType: "json"});
                },
                error: function (data) {
                }
            });
        },
        error: function (data) {
        }
    });
}

/**
 * 带过滤条件的数据处理
 * @param contentDormitoryData 宿舍数据
 * @param filterDormitorySn 宿舍编号过滤条件
 * @param filterDormitoryManagerName 辅导员姓名过滤条件
 */
function addBuildingDataWithFilter(contentDormitoryData, filterDormitorySn, filterDormitoryManagerName) {
    $.ajax({
        async: false,
        cache: false,
        type: 'GET',
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/building',
        success: function (data) {
            var buildingData = data._embedded.building;
            // 获取辅导员数据
            $.ajax({
                async: false,
                cache: false,
                type: 'GET',
                datType: "json",
                accept: "application/json;charset=UTF-8",
                contentType: "application/json;charset=UTF-8",
                url: '/dormitoryManager',
                success: function (managerData) {
                    var dormitoryManagerData = managerData._embedded.dormitoryManager;
                    var filteredData = [];
                    
                    for (var i = 0; i < contentDormitoryData.length; i++) {
                        var student = contentDormitoryData[i];
                        var hasDormitory = false;
                        
                        // 查找宿舍对应的楼宇
                        for (var j = 0; j < buildingData.length; j++) {
                            if (student.buildingId === buildingData[j].id) {
                                student.buildingName = buildingData[j].name;
                                
                                // 查找楼宇对应的辅导员
                                if (buildingData[j].dormitoryManagerId) {
                                    for (var k = 0; k < dormitoryManagerData.length; k++) {
                                        if (buildingData[j].dormitoryManagerId === dormitoryManagerData[k].id) {
                                            student.dormitoryManagerName = dormitoryManagerData[k].name;
                                            break;
                                        }
                                    }
                                }
                                if (!student.dormitoryManagerName) {
                                    student.dormitoryManagerName = '未分配';
                                }
                                
                                hasDormitory = true;
                                break;
                            }
                        }
                        
                        if (!hasDormitory) {
                            student.buildingName = '未分配';
                            student.dormitoryManagerName = '未分配';
                        }
                        
                        // 应用过滤条件
                        var matchDormitorySn = isNull(filterDormitorySn) || 
                            (student.sn && student.sn.indexOf(filterDormitorySn) !== -1);
                        var matchManagerName = isNull(filterDormitoryManagerName) || 
                            (student.dormitoryManagerName && student.dormitoryManagerName.indexOf(filterDormitoryManagerName) !== -1);
                        
                        if (matchDormitorySn && matchManagerName) {
                            filteredData.push(student);
                        }
                    }
                    
                    var table = $('#contentData');
                    table.bootstrapTable('refreshOptions', {data: filteredData, dataType: "json"});
                },
                error: function (data) {
                }
            });
        },
        error: function (data) {
        }
    });
}

function dormitoryFormatter(value, row, index) {
    var id = value;
    var result = "";
    result += "<button type='button' class='btn btn-warning' data-toggle='modal' data-target='#dormitoryUpdate' onclick=\"dormitoryUpdate('" + index + "')\"><i class='fa fa-pencil'></i> 修改</button>";
    result += "<button type='button' class='btn btn-danger' onclick=\"dormitoryDelete('" + id + "')\"><i class='fa fa-trash'></i> 删除</button>";
    return result;
}


function dormitoryQuery() {
    var dormitorySn = $("#dormitorySn").val();
    var dormitoryManagerName = $("#dormitoryManagerNameQuery").val();
    
    if (isNull(dormitorySn) && isNull(dormitoryManagerName)) {
        // 均为空，初始化查询
        $.ajax({
            async: false,
            cache: false,
            type: 'GET',
            datType: "json",
            accept: "application/json;charset=UTF-8",
            contentType: "application/json;charset=UTF-8",
            url: '/dormitory',
            success: function (data) {
                contentDormitoryData = data._embedded.dormitory;
                addBuildingData(contentDormitoryData);
            },
            error: function (data) {
            }
        });
    } else {
        // 有查询条件，先获取所有数据再过滤
        $.ajax({
            async: false,
            cache: false,
            type: 'GET',
            datType: "json",
            accept: "application/json;charset=UTF-8",
            contentType: "application/json;charset=UTF-8",
            url: '/dormitory',
            success: function (data) {
                contentDormitoryData = data._embedded.dormitory;
                
                // 如果只有宿舍编号查询
                if (!isNull(dormitorySn) && isNull(dormitoryManagerName)) {
                    $.ajax({
                        async: false,
                        cache: false,
                        type: 'GET',
                        datType: "json",
                        accept: "application/json;charset=UTF-8",
                        contentType: "application/json;charset=UTF-8",
                        url: '/dormitory/search/findBySn?sn=' + dormitorySn,
                        success: function (searchData) {
                            var dataArray = new Array();
                            if (!isNull(searchData)) {
                                dataArray.push(searchData);
                            }
                            contentDormitoryData = dataArray;
                            addBuildingData(contentDormitoryData);
                        },
                        error: function (data) {
                        }
                    });
                } else {
                    // 有辅导员姓名查询条件，需要过滤
                    addBuildingDataWithFilter(contentDormitoryData, dormitorySn, dormitoryManagerName);
                }
            },
            error: function (data) {
            }
        });
    }
}

function dormitoryAdd() {
    var contentData;
    var html = "";
    $.ajax({
        async: false,
        cache: false,
        type: 'GET',
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/building',
        success: function (data) {
            contentData = data._embedded.building;
            for (var i = 0; i < contentData.length; i++) {
                html += "<option value=\"" + contentData[i].id + "\">" + contentData[i].name + "</option>";
            }
            $("#addDormitoryBuildingId").html(html);
        },
        error: function (data) {
        }
    });
}

function dormitoryAddSave() {
    var data = {};
    data.sn = $("#addDormitorySn").val();
    data.buildingId = $("#addDormitoryBuildingId").val();
    data.floor = $("#addDormitoryFloor").val();
    data.maxNumber = $("#addDormitoryMaxNumber").val();
    data.livedNumber = $("#addDormitoryLivedNumber").val();
    $.ajax({
        async: true,
        cache: false,
        type: 'POST',
        data: JSON.stringify(data),
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/dormitory',
        success: function (data) {
            swal('温馨提示', '新增宿舍成功', 'success');
            initDormitoryData();
        },
        error: function (data) {
            swal('温馨提示', '新增宿舍失败', 'error');
        }
    });
}

function dormitoryUpdate(index) {
    var row = contentDormitoryData[index];
    editContentDormitoryData = contentDormitoryData[index];
    $("#updateDormitoryId").val(row.id);
    $("#updateDormitorySn").val(row.sn);
    $("#updateDormitoryFloor").val(row.floor);
    $("#updateDormitoryMaxNumber").val(row.maxNumber);
    $("#updateDormitoryLivedNumber").val(row.livedNumber);
    var contentData;
    var html = "";
    $.ajax({
        async: false,
        cache: false,
        type: 'GET',
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/building',
        success: function (data) {
            contentData = data._embedded.building;
            for (var i = 0; i < contentData.length; i++) {
                html += "<option value=\"" + contentData[i].id + "\">" + contentData[i].name + "</option>";
            }
            $("#updateDormitoryBuildingId").html(html);
        },
        error: function (data) {
        }
    });
}

function dormitoryUpdateSave() {
    var data = {};
    data.id = $("#updateDormitoryId").val();
    data.sn = $("#updateDormitorySn").val();
    data.floor = $("#updateDormitoryFloor").val();
    data.maxNumber = $("#updateDormitoryMaxNumber").val();
    data.livedNumber = $("#updateDormitoryLivedNumber").val();
    data.buildingId = $("#updateDormitoryBuildingId").val();
    data.createTime = editContentDormitoryData.createTime;
    $.ajax({
        async: true,
        cache: false,
        type: 'PUT',
        data: JSON.stringify(data),
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/dormitory/' + data.id,
        success: function (data) {
            swal('温馨提示', '修改宿舍成功', 'success');
            initDormitoryData();
        },
        error: function (data) {
            swal('温馨提示', '修改宿舍失败', 'error');
        }
    });
}

function dormitoryDelete(id) {
    var data = {};
    data.id = id;
    $.ajax({
        async: true,
        cache: false,
        type: 'DELETE',
        datType: "json",
        accept: "application/json;charset=UTF-8",
        contentType: "application/json;charset=UTF-8",
        url: '/dormitory/' + id,
        success: function (data) {
            swal('温馨提示', '删除宿舍成功', 'success');
            initDormitoryData();
        },
        error: function (data) {
            swal('温馨提示', '删除宿舍失败', 'error');
        }
    });
}

/**
 * 上传Excel文件
 */
function dormitoryUpload() {
    var uploadData = new FormData();
    var uploadName = $("#dormitoryUploadFile").val();
    uploadData.append("file", $("#dormitoryUploadFile")[0].files[0]);
    uploadData.append("name", uploadName);
    $.ajax({
        url: '/excel/import',
        type: 'POST',
        async: false,
        data: uploadData,
        // 告诉jQuery不要去处理发送的数据
        processData: false,
        // 告诉jQuery不要去设置Content-Type请求头
        contentType: false,
        beforeSend: function () {
            console.log("正在进行，请稍候");
        },
        success: function (data) {
            swal('温馨提示', '导入成功', 'success');
        }
    });
}