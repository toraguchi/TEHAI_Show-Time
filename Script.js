// 位置情報を取得するフラグ
let hasLocationPermission = false;

// Google Maps APIキーを設定
const GOOGLE_MAPS_API_KEY = "AIzaSyA0hj5yFG-9OZwWcL6o0RYYieGIlax0RMw";

// 企業リスト
const companies = [
    { 
        name: "丸松産業", 
        phone:"+0889127915",
        hours: "8:30〜16:30\n※全日・11:30〜13:00 持ち込み不可", 
        rate: "混廃 ¥65〜/kg\n木くず ¥30〜/kg", 
        address: "埼玉県新座市大和田2-231-1", 
        holiday: "土日祝(第二土曜日除く)", 
        location: { lat: 35.8054, lng: 139.5425 }
    },
    { 
        name: "オネスト", 
        phone:"+0889127915",
        hours: "日曜日以外／7：00～18：00\n日曜日・祝／10：00～17：00\n※日曜日予約制 前日15:00予約\n※全日・12:30〜13:00 持ち込み不可", 
        rate: "混廃 ¥65〜/kg\n木くず ¥35/kg", 
        address: "東京都江東区新木場4-3-26", 
        holiday: "第二日曜日", 
        location: { lat: 35.6667, lng: 139.7986 }
    },
    { 
        name: "東港金属", 
        phone:"+0889127915",
        hours: "全日 00:00〜23:59（24時間営業）", 
        rate: "混廃 ¥70〜/kg\n木くず ¥30/kg", 
        address: "東京都大田区京浜島2-20-4", 
        holiday: "年末年始", 
        location: { lat: 35.5843, lng: 139.7394 }
    },
    { 
        name: "旭商会", 
        phone:"+0889127915",
        hours: "8:30〜16:30\n※全日・12:00〜13:00 持ち込み不可", 
        rate: "混廃 ¥40〜/kg\n木くず ¥30/kg", 
        address: "神奈川県相模原市中央区宮下本町3-28-14", 
        holiday: "土日祝", 
        location: { lat: 35.5702, lng: 139.3607 }
    }
];
// 電話をかける
function callRequest(companyName) {
    const company = companies.find(c => c.name === companyName);
    if (!company || !company.phone) {
        alert("会社情報または電話番号が見つかりません");
        return;
    }

    // 電話番号にかけるためのリンクを作成
    const telLink = `tel:${company.phone}`;
    window.location.href = telLink; // 電話をかける
}

// 位置情報を取得して表示
function getUserLocation() {
    if (navigator.geolocation) {
        if (!hasLocationPermission) {  // 一度だけ位置情報を取得
            navigator.geolocation.getCurrentPosition((position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                hasLocationPermission = true; // 一度位置情報が取得できたらフラグを立てる
                calculateDistances(userLocation); // 位置情報取得後に距離計算
            }, (error) => {
                console.error("位置情報の取得に失敗しました:", error);
                alert("位置情報を許可してください。");
            });
        }
    } else {
        alert("ブラウザが位置情報をサポートしていません。");
    }
}

// 距離を計算して企業を並べ替え
function calculateDistances(userLocation) {
    const service = new google.maps.DistanceMatrixService();
    const destinations = companies.map(company => company.location);

    service.getDistanceMatrix({
        origins: [userLocation],
        destinations: destinations,
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK) {
            const results = response.rows[0].elements;
            companies.forEach((company, index) => {
                company.distance = results[index].distance.value; // 距離（メートル）
                company.duration = results[index].duration.text; // 移動時間（テキスト）
            });

            // 距離順に並べ替え
            companies.sort((a, b) => a.distance - b.distance);

            // すべての企業を表示
            displayCompanies(userLocation);
        } else {
            console.error("Distance Matrix APIのエラー:", status);
        }
    });
}

function displayCompanies(userLocation) {
    const container = document.getElementById("company-list");
    container.innerHTML = ""; // 初期化

    companies.forEach((company) => {
        // 各企業カードのHTMLを生成
        const card = document.createElement("div");
        card.className = "feature-item";
        card.innerHTML = `
            <h4>${company.name}</h4>
            <p><img src="path/to/open-time-icon.png" style="width: 20px; vertical-align: middle;"> 営業時間: ${formatTextWithLineBreaks(company.hours)}</p>
            <p><img src="path/to/rate-icon.png" style="width: 20px; vertical-align: middle;"> 処分単価: ${formatTextWithLineBreaks(company.rate)}</p>
            <p><img src="path/to/address-icon.png" style="width: 20px; vertical-align: middle;"> 住所: ${company.address}</p>
            <p><img src="path/to/holiday-icon.png" style="width: 20px; vertical-align: middle;"> 休日: ${company.holiday}</p>
            <p><img src="path/to/duration-icon.png" style="width: 20px; vertical-align: middle;"> 移動時間: ${company.duration || "計算中..."}</p>
            <div id="map-${company.name}" style="width: 100%; height: 300px;"></div>
            <button onclick="callRequest('${company.phone}')">tel依頼</button> <!-- 電話ボタン -->
            <button onclick="openRoute('${company.name}', ${userLocation.lat}, ${userLocation.lng})">経路案内</button>
        `;
        container.appendChild(card); // コンテナにカードを追加

        // 企業の地図を表示
        const mapElement = card.querySelector(`#map-${company.name}`);
        initMap(mapElement, company.location);
    });
}

// 電話依頼の処理
function callRequest(phoneNumber) {
    window.location.href = `tel:${phoneNumber}`;
}

// 改行をHTMLの <br> タグに変換
function formatTextWithLineBreaks(text) {
    return text.replace(/\n/g, "<br>"); // 改行を <br> タグに変換
}



// 依頼確認の2段階認証
function confirmRequest(companyName) {
    const confirmation = confirm("依頼でお間違いないですか？");
    if (confirmation) {
        sendRequest(companyName); // 確認後にメール送信
    }
}

// メール送信
function sendRequest(companyName) {
    const subject = encodeURIComponent("依頼内容");
    const body = encodeURIComponent(`依頼企業: ${companyName}\nサイトURL: ${window.location.href}`);
    const mailtoLink = `mailto:info@2019showtime.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
}

// Google Mapを初期化して企業の位置にマーカーを追加
function initMap(mapElement, location) {
    const map = new google.maps.Map(mapElement, {
        center: location,
        zoom: 14
    });
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: "企業の位置"
    });
}

function openRoute(companyName, userLat, userLng) {
    const company = companies.find(c => c.name === companyName);
    if (!company || !company.location) {
        alert("会社情報または位置情報が見つかりません");
        return;
    }

    // GoogleマップのURLを生成
    const destination = `${company.location.lat},${company.location.lng}`;
    const origin = `${userLat},${userLng}`;
    const googleMapsURL = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    // 新しいタブでGoogleマップを開く
    window.open(googleMapsURL, '_blank');
}



// 初期化
window.onload = () => {
    getUserLocation();
};
