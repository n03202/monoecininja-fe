/*
 This file is part of Monoeci Ninja.
 https://github.com/Yoyae/monoecininja-fe

 Monoeci Ninja is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Monoeci Ninja is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Monoeci Ninja.  If not, see <http://www.gnu.org/licenses/>.

 */

// Monoeci Ninja Front-End (monoecininja-fe) - Masternode Detail

var monoecininjaversion = '3.1.0';
var tablePayments = null;
var tableExStatus = null;
var dataProtocolDesc = [];
var maxProtocol = -1;
var monoecimainkeyregexp = /^[7X][a-zA-Z0-9]{33}$/;
var monoecitestkeyregexp = /^[yx][a-zA-Z0-9]{33}$/;
var monoecioutputregexp = /^[a-z0-9]{64}-[0-9]+$/;
var mnpubkey = '';
var mnvin = '';

$.fn.dataTable.ext.errMode = 'throw';

if (typeof monoecininjatestnet === 'undefined') {
  var monoecininjatestnet = 0;
}
if (typeof monoecininjatestnethost !== 'undefined') {
  if (window.location.hostname == monoecininjatestnethost) {
    monoecininjatestnet = 1;
    $('a[name=menuitemexplorer]').attr("href", "https://"+monoecininjatestnetexplorer);
  }
}

if (typeof monoecininjacoin === 'undefined') {
  var monoecininjacoin = ['',''];
}
if (typeof monoecininjaaddressexplorer === 'undefined') {
  var monoecininjaaddressexplorer = [[],[]];
}
if (typeof monoecininjaaddressexplorer[0] === 'undefined') {
  monoecininjaaddressexplorer[0] = [];
}
if (typeof monoecininjaaddressexplorer[1] === 'undefined') {
  monoecininjaaddressexplorer[1] = [];
}

function tablePaymentsRefresh(){
  tablePayments.api().ajax.reload();
  // Set it to refresh in 60sec
  setTimeout(tablePaymentsRefresh, 150000);
};

function mndetailsRefresh(useVin){
  console.log("DEBUG: mndetailsRefresh starting");
  $('#mninfosLR').html( '<i class="fa fa-spinner fa-pulse"></i> Refreshing <i class="fa fa-spinner fa-pulse"></i>' );
  var query = '/api/masternodes?balance=1&portcheck=1&lastpaid=1&exstatus=1&testnet='+monoecininjatestnet;
  if (useVin) {
    query += '&vins=["'+mnvin+'"]';
  }
  else {
    query += '&pubkeys=["'+mnpubkey+'"]';
  }
    console.log("DEBUG: REST query="+query);
  $.getJSON( query, function( data ) {
   var date = new Date();
   var n = date.toDateString();
   var time = date.toLocaleTimeString();
   var result = "";

   console.log("DEBUG: REST api query responded!");

   if ((!data.hasOwnProperty("data")) || (data.data.length < 1)) {
    result = 'Unknown masternode';
    $('#mnoutput').text(result+" ("+mnvin+")");
    $('#mnpubkey').text(result+" ("+mnpubkey+")");      
    $('#mnipport').text(result);      
    $('#mncountry').text(result);      
    $('#mnstatus').text(result).removeClass("danger").removeClass("warning").removeClass("success");
    $('#mnactiveduration').text(result);
    $('#mnlastseen').text(result);
    $('#mnbalance').text(result).removeClass("danger").removeClass("success");
    $('#mnlastpaid').text(result);
    $('#mnportcheck').text(result).removeClass("danger").removeClass("info").removeClass("success");
    $('#mnportchecknext').text(result);
    $('#mnversion').text(result);
   }
   else {

    $('#mnoutput').text( data.data[0].MasternodeOutputHash+"-"+data.data[0].MasternodeOutputIndex );
    $('#mnpubkey').text( data.data[0].MasternodePubkey );
       var mnip = "";
       if ( data.data[0].MasternodeIP == "::" ) {
           mnip = data.data[0].MasternodeTor+".onion";
       }
       else {
           mnip = data.data[0].MasternodeIP;
       }
    $('#mnipport').text( mnip+":"+data.data[0].MasternodePort );
    mnpubkey = data.data[0].MasternodePubkey;

    var activecount = parseInt(data.data[0].ActiveCount);
    var inactivecount = parseInt(data.data[0].InactiveCount);
    var unlistedcount = parseInt(data.data[0].UnlistedCount);
    var total = activecount+inactivecount+unlistedcount;
    var ratio = activecount / total;
    result = ratio;
    var cls = "";
    if ( ratio == 1 ) {
      result = 'Active';
      cls = "success";
    } else if ( ratio == 0 ) {
      result = 'Inactive';
      cls = "danger";
    } else if ( unlistedcount > 0 ) {
      result = 'Partially Unlisted';
      cls = "warning";
    } else {
      result = 'Partially Inactive';
      cls = "warning";
    }
    result += ' ('+Math.round(ratio*100)+'%)';
    $('#mnstatus').text(result).removeClass("danger").removeClass("warning").removeClass("success").addClass(cls);
    if (data.data[0].MasternodeActiveSeconds < 0) {
      result = 'Inactive';
    }
    else {
      result = diffHRlong(data.data[0].MasternodeActiveSeconds);
    }
    $('#mnactiveduration').text ( result);
    if (data.data[0].MasternodeLastSeen > 0) {
        var tmpDate = new Date(data.data[0].MasternodeLastSeen*1000);
        result = tmpDate.toLocaleString()+" ("+deltaTimeStampHRlong(data.data[0].MasternodeLastSeen,currenttimestamp())+" ago)";
    }
    else {
      result = 'Just now ('+data.data[0].MasternodeLastSeen+')';
    }
    $('#mnlastseen').text ( result);

    // Balance data
    var num = Math.round( data.data[0].Balance.Value * 1000 ) / 1000;
    if ( num < 1000 ) {
      cls = "danger";
    } else {
      cls = "success";
    }
    $('#mnbalance').text ( addCommas( num.toFixed(3) )+' '+monoecininjacoin[monoecininjatestnet]).removeClass("danger").removeClass("success").addClass(cls);

    // Last Paid data
    var outtxt = "";
    if (data.data[0].MasternodeLastPaid != 0) {
        var tmpDate = new Date(data.data[0].MasternodeLastPaid*1000);
      outtxt = tmpDate.toLocaleString()+" ("+deltaTimeStampHRlong(parseInt(data.data[0].MasternodeLastPaid),currenttimestamp())+" ago)";
    }
    else {
      outtxt = 'Never/Unknown';
    }
    $('#mnlastpaid').html( outtxt );

    // Last Paid from blocks data
    var outtxt = "";
    if (data.data[0].LastPaidFromBlocks !== false) {
      var tmpDate = new Date(data.data[0].LastPaidFromBlocks.MNLastPaidTime*1000);
      outtxt = tmpDate.toLocaleString()+" ("+deltaTimeStampHRlong(parseInt(data.data[0].LastPaidFromBlocks.MNLastPaidTime),currenttimestamp())+" ago) on block ";
      if (monoecininjaqueryexplorer[monoecininjatestnet].length > 0) {
        outtxt += '<a href="'+monoecininjaqueryexplorer[monoecininjatestnet][0][0].replace('%%q%%',data.data[0].LastPaidFromBlocks.MNLastPaidBlock)+'">'+data.data[0].LastPaidFromBlocks.MNLastPaidBlock+'</a>';
      }
      else {
        outtxt += data.data[0].LastPaidFromBlocks.MNLastPaidBlock;
      }
    }
    else {
      outtxt = 'Never/Unknown';
    }
    $('#mnlastpaidfromblocks').html( outtxt );

    cls = "danger";
    if (Math.abs(parseInt(data.data[0].MasternodeLastPaid)-parseInt(data.data[0].LastPaidFromBlocks.MNLastPaidTime)) < 120) {
      cls = "success";
    }
    $('#mnlastpaid').removeClass("success").removeClass("danger").addClass(cls);
    $('#mnlastpaidfromblocks').removeClass("success").removeClass("danger").addClass(cls);

    // Port Check data
    $('#mncountry').html( '<img src="/static/flags/flags_iso/16/'+data.data[0].Portcheck.CountryCode+'.png" width=16 height=16 /> '+data.data[0].Portcheck.Country );
    var txt = data.data[0].Portcheck.Result;
    cls = "";
    if ((data.data[0].Portcheck.Result == 'closed') || (data.data[0].Portcheck.Result == 'timeout')) {
      txt = "Closed ("+data.data[0].Portcheck.ErrorMessage+")";
      cls = "danger";
    } else if (data.data[0].Portcheck.Result == 'unknown') {
      txt = "Pending";
      cls = "info";
    } else if ((data.data[0].Portcheck.Result == 'open') || (data.data[0].Portcheck.Result == 'rogue')) {
      txt = "Open";
      cls = "success";
    }
    $('#mnportcheck').text(txt).removeClass("danger").removeClass("info").removeClass("success").addClass(cls);
    if (data.data[0].Portcheck.NextCheck < currenttimestamp()) {
      if (txt != "Pending") {
        $('#mnportchecknext').text('Re-check pending');
      }
    }
    else {
      $('#mnportchecknext').text(deltaTimeStampHRlong(data.data[0].Portcheck.NextCheck,currenttimestamp()));
    }
    var versioninfo = '<i>Unknown</i>';
    if ((data.data[0].hasOwnProperty("Portcheck")) && (data.data[0].Portcheck != false)) {
        if ((data.data[0].Portcheck.SubVer.length > 10) && (data.data[0].Portcheck.SubVer.substring(0, 9) == '/Satoshi:') && (data.data[0].Portcheck.SubVer.substring(data.data[0].Portcheck.SubVer.length - 1) == '/')) {
            versioninfo = data.data[0].Portcheck.SubVer.substring(9, data.data[0].Portcheck.SubVer.indexOf('/', 10));
        }
        else if ((data.data[0].Portcheck.SubVer.length > 7) && (data.data[0].Portcheck.SubVer.substring(0, 6) == '/Core:') && (data.data[0].Portcheck.SubVer.substring(data.data[0].Portcheck.SubVer.length - 1) == '/')) {
            versioninfo = data.data[0].Portcheck.SubVer.substring(6, data.data[0].Portcheck.SubVer.indexOf('/', 6));
        }
        else if ((data.data[0].Portcheck.SubVer.length > 11) && (data.data[0].Portcheck.SubVer.substring(0, 11) == '/Monoeci Core:') && (data.data[0].Portcheck.SubVer.substring(data.data[0].Portcheck.SubVer.length - 1) == '/')) {
            versioninfo = data.data[0].Portcheck.SubVer.substring(11, data.data[0].Portcheck.SubVer.indexOf('/', 11));
        }
    }
    else {
        versioninfo = "Unknown";
    }
    $('#mnversion').html( versioninfo+" (Protocol="+data.data[0].MasternodeProtocol+")" );
   }
   $('#mninfosLR').text( n + ' ' + time );

      tablePayments = $('#paymentstable').dataTable( {
        ajax: { url: '/api/blocks?testnet='+monoecininjatestnet+'&pubkeys=["'+data.data[0].MasternodePubkey+'"]&interval=P1M',
                dataSrc: 'data.blocks' },
        paging: false,
        order: [[ 0, "desc" ]],
        columns: [
            { data: null, render: function ( data, type, row ) {
              if (type == 'sort') {
                return data.BlockTime;
              }
              else {
                var date = new Date(data.BlockTime*1000);
                var day = "0"+date.getDate();
                var month = "0"+(date.getMonth()+1);
                var year = date.getFullYear();
                var hours = "0"+date.getHours();
                var minutes = "0" + date.getMinutes();
                var seconds = "0" + date.getSeconds();
                var formattedTime = hours.substr(hours.length-2) + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);
                return date.getFullYear()+"-"+month.substr(month.length-2)+"-"+day.substr(day.length-2)+" "+formattedTime;
              }

            } },
            { data: null, render: function ( data, type, row ) {
               var outtxt = data.BlockId;
               if (type != 'sort') {
                 if (monoecininjablockexplorer[monoecininjatestnet].length > 0) {
                   outtxt = '<a href="'+monoecininjablockexplorer[monoecininjatestnet][0][0].replace('%%b%%',data.BlockHash)+'">'+data.BlockId+'</a>';
                 }
               }
               return outtxt;
            } },
            { data: null, render: function ( data, type, row ) {
               var outtxt = data.BlockPoolPubKey;
               if (data.PoolDescription) {
                 outtxt = data.PoolDescription;
               }
               return outtxt;
            } },
            { data: "BlockMNValue" },
            { data: null, render: function ( data, type, row ) {
               return (Math.round(data.BlockMNValueRatioExpected*1000)/10).toFixed(1)+"%/"+(Math.round(data.BlockMNValueRatio*1000)/10).toFixed(1)+"%";
            } },
            { data: null, render: function ( data, type, row ) {
               if ((type != "sort") && (data.BlockMNPayeeExpected == "")) {
                 return "<i>Unknown</i>";
               } else if (type == "sort") {
                 return data.BlockMNPayeeExpected;
               } else {
                 return '<a href="'+monoecininjamasternodemonitoring[monoecininjatestnet].replace('%%p%%',data.BlockMNPayeeExpected)+'">'+data.BlockMNPayeeExpected+'</a>';;
               }
            } },
            { data: null, render: function ( data, type, row ) {
               if ((type != "sort") && (data.BlockMNPayee == "")) {
                 return "<i>Unpaid block</i>";
               } else if (type == "sort") {
                 return data.BlockMNPayee;
               } else {
                 return '<a href="'+monoecininjamasternodemonitoring[monoecininjatestnet].replace('%%p%%',data.BlockMNPayee)+'">'+data.BlockMNPayee+'</a>';;
               }
            } }
        ],
        createdRow: function ( row, data, index ) {
          if (data.BlockMNPayeeExpected == mnpubkey) {
            $('td',row).eq(5).css({"background-color": "#8FFF8F"});
          }
          else {
            $('td',row).eq(5).css({"background-color": "#FF8F8F"});
          }
          if (data.BlockMNPayee == mnpubkey) {
            $('td',row).eq(6).css({"background-color": "#8FFF8F"});
          }
          else {
            $('td',row).eq(6).css({"background-color": "#FF8F8F"});
          }
        }
   } );
      tableExStatus = $('#exstatustable').dataTable( {
          data: data.data[0].ExStatus,
          paging: false,
          order: [[ 0, "asc" ]],
          columns: [
              { data: "NodeName" },
              { data: "NodeVersion" },
              { data: "NodeProtocol" },
              { data: null, render: function ( data, type, row ) {
                  if (type == "sort") {
                      return data.Status;
                  } else if (data.Status == "active") {
                      return '<i class="fa fa-play"> Active';
                  } else if (data.Status == "inactive") {
                      return '<i class="fa fa-pause"> Inactive';
                  } else if (data.Status == "unlisted") {
                      return '<i class="fa fa-stop"> Unlisted';
                  }
              } },
              { data: null, render: function ( data, type, row ) {
                  var outtxt = '';
                  if (type != "sort") {
                      if (data.StatusEx == "ENABLED") {
                          outtxt = '<i class="fa fa-thumbs-up"> ';
                      } else if (data.StatusEx == "PRE_ENABLED") {
                          outtxt = '<i class="fa fa-thumbs-o-up"> ';
                      } else if (data.StatusEx == "WATCHDOG_EXPIRED") {
                          outtxt = '<i class="fa fa-cogs"> ';
                      } else if (data.StatusEx == "POS_ERROR") {
                          outtxt = '<i class="fa fa-exclamation-triangle"> ';
                      } else if (data.StatusEx == "REMOVE") {
                          outtxt = '<i class="fa fa-chain-broken"> ';
                      } else if (data.StatusEx == "EXPIRED") {
                          outtxt = '<i class="fa fa-clock-o"> ';
                      } else if (data.StatusEx == "VIN_SPENT") {
                          outtxt = '<i class="fa fa-money"> ';
                      } else if (data.StatusEx == "NEW_START_REQUIRED") {
                          outtxt = '<i class="fa fa-wrench"> ';
                      } else if (data.StatusEx == "UPDATE_REQUIRED") {
                          outtxt = '<i class="fa fa-wrench"> ';
                      } else if (data.StatusEx != '') {
                          outtxt = '<i class="fa fa-thumbs-down"> ';
                      }
                  }
                  outtxt = outtxt+data.StatusEx;
                  return outtxt;
              } }
          ],
          createdRow: function ( row, data, index ) {
              if (data.Status == "active") {
                  $('td',row).eq(3).css({"background-color": "#dff0d8", "color": "#3c763d"});
              }
              else if (data.Status == "inactive") {
                  $('td',row).eq(3).css({"background-color": "#fcf8e3", "color": "#8a6d3b"});
              }
              else {
                  $('td',row).eq(3).css({"background-color": "#f2dede", "color": "#a94442"});
              }
              if (data.StatusEx == "ENABLED") {
                  $('td',row).eq(4).css({"background-color": "#dff0d8", "color": "#3c763d"});
              }
              else if (data.StatusEx == "PRE_ENABLED") {
                  $('td',row).eq(4).css({"background-color": "#fcf8e3", "color": "#8a6d3b"});
              }
              else {
                  $('td',row).eq(4).css({"background-color": "#f2dede", "color": "#a94442"});
              }
          }
      } );
      $('#exstatustableLR').text( n + ' ' + time );
   console.log("DEBUG: auto-refresh starting");
   setTimeout(mndetailsRefresh, 300000);
  });
};

$(document).ready(function(){

  $('#monoecininjajsversion').text( monoecininjaversion ).addClass("label-info").removeClass("label-danger");

  if (monoecininjatestnet == 1) {
    $('#testnetalert').show();
  }

  mnpubkey = getParameter("mnpubkey");
  console.log("DEBUG: mnpubkey="+mnpubkey);
  mnvin = getParameter("mnoutput");
  console.log("DEBUG: mnvin="+mnvin);

  if ((mnpubkey == "") && (mnvin == "")) {
    mnpubkey = 'Need "mnpubkey" parameter';
    $('#mnpubkey').text(mnpubkey);
    mnvin = 'Need "mnoutput" parameter';
    $('#mnvin').text(mnvin);
  }
  else {
    if ((mnpubkey != "") && (mnvin == "")) {
      if (((monoecininjatestnet == 0) && (!monoecimainkeyregexp.test(mnpubkey)))
        || ((monoecininjatestnet == 1) && (!monoecitestkeyregexp.test(mnpubkey)))) {
        mnpubkey = 'Invalid';
        $('#mnpubkey').text(mnpubkey);
      }
      else {
        mndetailsRefresh(false);
      }
    }
    else {
      if (!monoecioutputregexp.test(mnvin)) {
        mnvin = 'Invalid';
        $('#mnoutput').text( mnvin );
      }
      else {
        mndetailsRefresh(true);
      }
    }
  }

  $('#paymentstable').on('xhr.dt', function ( e, settings, json ) {
        // Fill per version stats table
        var totpaid = 0.0;
        var numpaid = 0;
        var missed = 0;
        var hijacked = 0;
        for (var block in json.data.blocks) {
          if(json.data.blocks[block].BlockMNPayee == mnpubkey) {
            totpaid += parseFloat(json.data.blocks[block].BlockMNValue);
            numpaid ++;
            if (json.data.blocks[block].BlockMNPayee != json.data.blocks[block].BlockMNPayeeExpected) {
              hijacked++;
            }
          }
          else {
            if (json.data.blocks[block].BlockMNPayee != json.data.blocks[block].BlockMNPayeeExpected) {
              missed++;
            }
          }
        }
        var num = Math.round( totpaid * 1000 ) / 1000;
        $('#mntotalpaid').text ( addCommas( num.toFixed(3) )+' '+monoecininjacoin[monoecininjatestnet]+' ('+numpaid+' times / '+missed+' missed / '+hijacked+' hijacked)');

        // Change the last refresh date
        var date = new Date();
        var n = date.toDateString();
        var time = date.toLocaleTimeString();
        $('#paymentstableLR').text( n + ' ' + time );
      } );

});
