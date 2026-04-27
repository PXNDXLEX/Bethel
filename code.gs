/**
 * DULCE BETHEL v45 - BACKEND CONSOLIDADO
 */

function doGet() {
  var html;
  try { html = HtmlService.createHtmlOutputFromFile('Index'); } 
  catch (e) { html = HtmlService.createHtmlOutputFromFile('index'); }
  return html.setTitle('Dulce Bethel OS')
             .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
             .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Helper para garantizar que todos los números que van a la hoja
 * se guarden como decimales reales y no den errores por las comas.
 */
function parseNum(val) {
  if (val === "" || val === null || val === undefined) return 0;
  var num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

/**
 * Helper para sanear los datos antes de enviarlos al frontend.
 * Evita que Google Apps Script devuelva NULL bloqueando JSON.
 */
function sanitizeData(data) {
  return data.map(function(row) {
    return row.map(function(cell) {
      if (cell instanceof Date) {
        return cell.toISOString(); 
      }
      return cell;
    });
  });
}

/**
 * LECTURA DE DATOS PRINCIPAL
 */
function db_getData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  function getSheetData(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    return data.length > 1 ? sanitizeData(data.slice(1)) : [];
  }

  // 1. Configuración General (Logo y Nombre)
  var confObj = { nombre: "Dulce Bethel", logo: "" };
  var confSh = ss.getSheetByName('Config');
  if (confSh) {
    var cData = confSh.getDataRange().getValues();
    
    var valA = cData[0] ? String(cData[0][0]).trim() : '';
    var valB = cData[0] ? String(cData[0][1]).trim() : '';
    var valC = cData[0] ? String(cData[0][2]).trim() : '';

    if (valB.indexOf('http') === 0) {
        confObj.logo = valB;
        confObj.nombre = (valA !== 'NombreNegocio' && valA !== '') ? valA : 'Dulce Bethel';
    } else if (valC.indexOf('http') === 0) {
        confObj.logo = valC;
        confObj.nombre = valB || 'Dulce Bethel';
    } else {
        confObj.nombre = valB || 'Dulce Bethel';
        confObj.logo = valC;
    }
  }

  // 2. TASA DEL DÓLAR
  var bcvRate = db_getBCV();

  // 3. Productos
  var pData = getSheetData("Productos");
  var productos = pData.map(function(r) {
    return { nombre: r[0], precio: parseNum(r[1]), stock: parseNum(r[2]), precioMayor: parseNum(r[3]) };
  });

  // 4. Lugares
  var sLugares = ss.getSheetByName("Lugares");
  var lugaresRaw = sLugares ? sLugares.getDataRange().getValues().map(function(r) { return String(r[0]).trim(); }).filter(String) : [];
  if(lugaresRaw.length > 0 && lugaresRaw[0].toLowerCase().indexOf('lugar') !== -1) lugaresRaw.shift();
  var lugares = lugaresRaw.filter(function(item, pos) { return lugaresRaw.indexOf(item) == pos; });

  // 5. Clientes
  var sClientes = ss.getSheetByName("Clientes");
  var clientesRaw = sClientes ? sClientes.getDataRange().getValues().map(function(r) { return String(r[0]).trim(); }).filter(String) : [];
  if(clientesRaw.length > 0 && (clientesRaw[0].toLowerCase() === 'cliente' || clientesRaw[0].toLowerCase() === 'clientes' || clientesRaw[0].toLowerCase() === 'nombre')) clientesRaw.shift();
  var clientes = clientesRaw.filter(function(item, pos) { return clientesRaw.indexOf(item) == pos; });

  // RETORNO
  return {
    config: confObj,
    bcv: bcvRate,
    productos: productos,
    lugares: lugares,
    clientes: clientes,
    pedidosRaw: getSheetData("Pedidos"),     
    pagosRaw: getSheetData("Pagos"),
    gastosRaw: getSheetData("Gastos"), // Ahora son compras de materia prima, mantenemos "Gastos" internamente para evitar romper
    produccionRaw: getSheetData("Produccion"),
    movimientosRaw: getSheetData("Movimientos") // Nva Hoja
  };
}

/**
 * LECTURA API BCV
 */
function db_getBCV() {
  try {
    var res = UrlFetchApp.fetch("https://ve.dolarapi.com/v1/dolares/oficial", {muteHttpExceptions: true});
    if (res.getResponseCode() === 200) {
      var data = JSON.parse(res.getContentText());
      if (data.promedio) return parseFloat(data.promedio);
    }
  } catch(e) {}
  
  try {
    var res2 = UrlFetchApp.fetch("https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv", {muteHttpExceptions: true});
    if (res2.getResponseCode() === 200) {
      var data2 = JSON.parse(res2.getContentText());
      if (data2.monitors && data2.monitors.usd && data2.monitors.usd.price) {
        return parseFloat(data2.monitors.usd.price);
      }
    }
  } catch(e) {}
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var confSh = ss.getSheetByName('Config');
    if(confSh) {
      var v = confSh.getRange(2, 2).getValue(); 
      if(v) return parseNum(v);
    }
  } catch(e) {}
  
  return 0;
}

/**
 * PRODUCTOS E INVENTARIO
 */
function db_saveProduct(p) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Productos");
  var d = s.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < d.length; i++) {
    if (String(d[i][0]).trim().toLowerCase() === String(p.old).trim().toLowerCase()) {
      s.getRange(i + 1, 1).setValue(p.nombre);
      s.getRange(i + 1, 2).setValue(parseNum(p.precio));
      s.getRange(i + 1, 3).setValue(parseNum(p.stock));
      s.getRange(i + 1, 4).setValue(parseNum(p.precioMayor));
      found = true; break;
    }
  }
  if (!found) s.appendRow([p.nombre, parseNum(p.precio), parseNum(p.stock), parseNum(p.precioMayor)]);
  return db_getData();
}

function db_delProduct(n) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Productos");
  if (!s) return db_getData();
  var d = s.getDataRange().getValues();
  for (var i = 1; i < d.length; i++) {
    if (String(d[i][0]).trim().toLowerCase() === String(n).trim().toLowerCase()) {
      s.deleteRow(i + 1); break;
    }
  }
  return db_getData();
}

/**
 * VENTA (CAJA)
 */
function db_saveOrder(form, cart) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPedidos = ss.getSheetByName("Pedidos");
  var sheetPagos = ss.getSheetByName("Pagos");
  var sheetProductos = ss.getSheetByName("Productos");
  
  var now = new Date();
  var bcvRate = parseNum(form.bcvRate);
  
  var detallesArr = [];
  var abonoRestante = parseNum(form.abonadoUSD);
  
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    var precioItem = parseNum(item.precio);
    var cantItem = parseNum(item.cantidad);
    var totalItem = precioItem * cantItem;
    
    var abonoParaEsteItem = Math.min(abonoRestante, totalItem);
    abonoRestante -= abonoParaEsteItem;
    var deudaDeEsteItem = totalItem - abonoParaEsteItem;
    
    sheetPedidos.appendRow([
      form.cliente,
      item.nombre,
      cantItem,
      form.lugar,
      form.fecha ? form.fecha + "T12:00:00.000Z" : now.toISOString(), 
      totalItem,            
      precioItem,           
      "Pendiente",          
      form.numEntrega || "-",
      form.notas,           
      bcvRate,              
      abonoParaEsteItem,    
      deudaDeEsteItem,      
      form.telefono         
    ]);

    var prodData = sheetProductos.getDataRange().getValues();
    for (var p = 1; p < prodData.length; p++) {
      if (String(prodData[p][0]).trim() === item.nombre) {
        var currentStock = parseNum(prodData[p][2]);
        sheetProductos.getRange(p + 1, 3).setValue(currentStock - cantItem);
        break;
      }
    }
    
    detallesArr.push(cantItem + "|" + item.nombre + "|" + precioItem.toFixed(2) + "|" + totalItem.toFixed(2));
  }
  
  var detalles = detallesArr.join(";");

  if (parseNum(form.abonadoUSD) > 0) {
    sheetPagos.appendRow([
      now.toISOString(),
      form.cliente,
      parseNum(form.abonadoUSD),
      parseNum(form.abonadoUSD) * bcvRate,
      bcvRate,
      form.ref,
      form.notaPago,
      detalles,
      form.numEntrega 
    ]);
  }

  return db_getData();
}

/**
 * PAGO DE DEUDAS (ABONOS)
 */
function db_payDebt(indicesStr, montoUSD, ref, nota, bcvRate, numEntrega) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pedSh = ss.getSheetByName('Pedidos');
    var pagSh = ss.getSheetByName('Pagos');

    var indices = indicesStr.split(',').map(Number);
    var fechaStr = new Date().toISOString();

    var montoRestante = parseNum(montoUSD);
    var clienteName = "";
    var resumenPagos = {}; 
    
    var pData = pedSh.getDataRange().getValues();

    indices.forEach(function(idx) {
        var rowNum = idx + 2; 
        var rowData = pData[rowNum - 1]; 
        clienteName = rowData[0];
        
        var prodName = rowData[1];
        var qtyOrig = parseNum(rowData[2]) || 1; 
        var totalRow = parseNum(rowData[5]);
        var pu = totalRow / qtyOrig; 
        
        var abonoAnterior = parseNum(rowData[11]);
        var deudaRow = parseNum(rowData[12]);

        if (montoRestante > 0 && deudaRow > 0) {
            var aCobrar = Math.min(deudaRow, montoRestante);
            var nuevoAbono = abonoAnterior + aCobrar;
            var nuevaDeuda = totalRow - nuevoAbono;

            pedSh.getRange(rowNum, 12).setValue(parseNum(nuevoAbono)); 
            pedSh.getRange(rowNum, 13).setValue(parseNum(nuevaDeuda)); 

            var key = prodName + "_" + pu.toFixed(2);
            if (!resumenPagos[key]) resumenPagos[key] = { nombre: prodName, pu: pu, qty: 0, cobrado: 0 };
            resumenPagos[key].qty += qtyOrig;
            resumenPagos[key].cobrado += aCobrar;

            montoRestante -= aCobrar;
        }
    });

    var detallesPagados = [];
    for (var k in resumenPagos) {
        var item = resumenPagos[k];
        detallesPagados.push(item.qty + "|" + item.nombre + "|" + item.pu.toFixed(2) + "|" + item.cobrado.toFixed(2));
    }

    var bs = parseNum(montoUSD * bcvRate);
    var detStr = detallesPagados.join(";");
    var notaEnvio = numEntrega || ("NE-" + Math.floor(100000 + Math.random() * 900000));

    pagSh.appendRow([fechaStr, clienteName, parseNum(montoUSD), bs, parseNum(bcvRate), ref, nota, detStr, notaEnvio]);

    return db_getData();
}

/**
 * ACTUALIZADOR DE CELDAS DINÁMICO
 */
function db_updateCell(rowIdx, colIdx, val) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pedidos");
  s.getRange(parseInt(rowIdx) + 2, parseInt(colIdx)).setValue(val);
  return db_getData();
}

/**
 * COMPRAS MATERIA PRIMA (Internamente sigue usando Gastos)
 */
function db_saveGasto(g) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Gastos");
  var fecha = g.fecha ? g.fecha + "T12:00:00.000Z" : new Date().toISOString();
  s.appendRow([fecha, g.desc, parseNum(g.cantidad), parseNum(g.precioUnitario), parseNum(g.total)]);
  return db_getData();
}

function db_delGasto(idx) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Gastos");
  if (s) s.deleteRow(parseInt(idx) + 2);
  return db_getData();
}

/**
 * PRODUCCIÓN
 */
function db_saveProduccion(obj) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Produccion");
  var now = obj.fecha ? obj.fecha + "T12:00:00.000Z" : new Date().toISOString();
  
  for (var i = 0; i < obj.items.length; i++) {
    var it = obj.items[i];
    s.appendRow([now, it.producto, parseNum(it.cantidad)]);
    
    var sProd = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Productos");
    var d = sProd.getDataRange().getValues();
    for (var j = 1; j < d.length; j++) {
      if (String(d[j][0]).trim() === String(it.producto).trim()) {
        sProd.getRange(j + 1, 3).setValue(parseNum(d[j][2]) + parseNum(it.cantidad));
        break;
      }
    }
  }
  return db_getData();
}

/**
 * MOVIMIENTOS Y PRÉSTAMOS
 */
function db_saveMovimiento(m) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName("Movimientos");
  if(!s) {
      s = ss.insertSheet("Movimientos");
      s.appendRow(["Fecha", "Tipo", "Categoría", "Persona", "Descripción", "Monto USD"]);
  }
  
  var isoDate = new Date().toISOString(); 
  if(m.fecha) {
      var today = new Date();
      var dParts = m.fecha.split('-');
      if(dParts[0] == today.getFullYear() && dParts[1] == (today.getMonth()+1) && dParts[2] == today.getDate()) {
          isoDate = today.toISOString(); // conserva hora real si es hoy
      } else {
          isoDate = m.fecha + "T12:00:00.000Z";
      }
  }
  
  s.appendRow([isoDate, m.tipo, m.categoria, m.persona, m.desc, parseNum(m.monto)]);
  return db_getData();
}

function forzarPermisos() {
  UrlFetchApp.fetch("https://google.com");
}