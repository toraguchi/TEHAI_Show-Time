document.addEventListener("DOMContentLoaded", function () {
    const caseList = document.getElementById("case-list");
    const processingCompanySelect = document.getElementById("processing-company");
    if (!processingCompanySelect) {
        console.error("Processing company select element not found");
        return; // Prevent further execution if the element doesn't exist
    }
    
    const saveCaseButton = document.getElementById("save-case");
    if (!saveCaseButton) {
        console.error("Save case button not found");
        return; // Prevent further execution if the button doesn't exist
    }
        const formContainer = document.getElementById("crm-form");
    const travelTimeInput = document.getElementById("travel-time");
    const postalCodeInput = document.getElementById("postalcode");
    const deadlineInput = document.getElementById("deadline"); // 回答期限入力
    const addressInput = document.getElementById("address");

    document.addEventListener("DOMContentLoaded", function () {
        const companyListContainer = document.getElementById("company-list");
        if (!companyListContainer) {
            console.error("企業リストのコンテナ (#company-list) が見つかりません。HTMLを確認してください。");
            return;
        }
        getUserLocation(); // ユーザー位置情報取得 & 企業リスト表示
    });
    

    // 住所の入力フィールドを非表示にする
    if (addressInput) {
        addressInput.style.display = "none";
    }

    const prefectureInput = document.createElement("input");
    prefectureInput.id = "prefecture";
    prefectureInput.placeholder = "都道府県";
    prefectureInput.readOnly = true; // 手入力を無効化
    prefectureInput.style.backgroundColor = "#f0f0f0"; // 薄いグレーでハイライト
    addressInput.parentNode.insertBefore(prefectureInput, addressInput);

    const cityInput = document.createElement("input");
    cityInput.id = "city";
    cityInput.placeholder = "市区町村／町名";
    cityInput.readOnly = true; // 手入力を無効化
    cityInput.style.backgroundColor = "#f0f0f0"; // 薄いグレーでハイライト
    addressInput.parentNode.insertBefore(cityInput, addressInput);

    const townInput = document.createElement("input");
    townInput.id = "town";
    townInput.placeholder = "番地";
    addressInput.parentNode.insertBefore(townInput, addressInput);

    let editingIndex = null;


    if (!processingCompanySelect) return;
  // 自動で住所読み込み
    document.getElementById("create-case-location").addEventListener("click", async function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async function (position) {
                    const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    document.getElementById("address").dataset.lat = userLocation.lat;
                    document.getElementById("address").dataset.lng = userLocation.lng;
    
                    reverseGeocode(userLocation.lat, userLocation.lng, async function (address, postalCode) {
                        addressInput.value = address;
                        postalCodeInput.value = postalCode;
                        
                        // getApproximateLocation を非同期で実行
                        const approximateLocation = await getApproximateLocation(postalCode);
                        if (approximateLocation) {
                            prefectureInput.value = approximateLocation.prefecture;
                            cityInput.value = approximateLocation.city;
                            townInput.value = approximateLocation.town;
                            populateCompaniesByDistance(approximateLocation);
                        }
                    });
                },
                function (error) {
                    console.error("位置情報の取得に失敗しました:", error);
                    alert("現在地を取得できませんでした。位置情報の許可を確認してください。");
                }
            );
        }
        formContainer.classList.remove("hidden");
        editingIndex = null;
        resetForm();
    });
    
  // 自動で住所反映
    function reverseGeocode(lat, lng, callback) {
        const apiKey = "AIzaSyA0hj5yFG-9OZwWcL6o0RYYieGIlax0RMw";
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
            .then(response => response.json())
            .then(responseData => {
                console.log(responseData);  // レスポンス全体を確認
                if (responseData.status === "OK" && responseData.results.length > 0) {
                    let address = responseData.results[0].formatted_address;
                    let postalCode = "";
                    let prefecture = "";
                    let cityTown = ""; // 市区町村＋町名
                    let town = ""; // 番地部分
    
                    // address_components の詳細をログで確認
                    console.log("address_components:", responseData.results[0].address_components);
    
                    // 各コンポーネントをチェック
                    for (let component of responseData.results[0].address_components) {
                        if (component.types.includes("postal_code")) {
                            postalCode = component.long_name;
                        } else if (component.types.includes("administrative_area_level_1")) {
                            prefecture = component.long_name;
                        } else if (
                            component.types.includes("route") ||  // 町名や通り名
                            component.types.includes("locality") ||
                            component.types.includes("sublocality_level_1") ||
                            component.types.includes("sublocality_level_2")
                        ) {
                            cityTown = component.long_name+cityTown; // 市区町村＋町名
                        } else if (component.types.includes("street_address") || component.types.includes("street_number")) {
                            // 番地部分の検出 (丁目+番地の形式)
                            town = component.long_name ? component.long_name : town;
                        } else if (component.types.includes("premise") || component.types.includes("subpremise")) {
                            // 建物名や部屋番号を無視
                            continue;
                        }
                    }
    
                    // 番地が見つからない場合、formatted_addressから推定する
                    if (!town.trim() && responseData.results[0].formatted_address) {
                        // 全角数字（０１２３４５６７８９）と全角のダッシュ（−）に対応する正規表現
                        const match = responseData.results[0].formatted_address.match(/([０-９]+丁目[０-９]+−[０-９]+|[０-９]+丁目[０-９]+|\d+丁目\d+[-−]\d+[-−]\d+)/); 
                        console.log("正規表現による抽出結果:", match);  // 正規表現の結果を確認
                        if (match) {
                            town = match[0]; // 正規表現で番地部分を抽出
                        } else {
                            town = "番地が見つかりません";
                        }
                    }
    
                    // 番地（丁目＋番地）が正しく抽出された場合、それを表示
                    townInput.value = town.trim(); 
    
                    // 他のフィールドに値をセット
                    addressInput.value = address;
                    postalCodeInput.value = postalCode;
                    prefectureInput.value = prefecture;
                    cityInput.value = cityTown.trim();
                } else {
                    console.error("住所の取得に失敗しました");
                }
            })
            .catch(error => {
                console.error("ジオコーディングのエラー:", error);
            });
    }
    
    
    
      // 郵便番号から住所反映
        postalCodeInput.addEventListener("blur", function () {
        const postalCode = postalCodeInput.value.trim();
        if (!postalCode) return;
    
        fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200 && data.results) {
                    const result = data.results[0];
                    prefectureInput.value = result.address1.trim(); // 都道府県
                    cityInput.value = (result.address2 + " " + (result.address3 || "")).trim(); // 市区町村 + 町名を統合
                    townInput.value = ""; // 番地・建物名は手入力
    
                } else {
                    alert("郵便番号に該当する住所が見つかりません");
                    prefectureInput.value = "";
                    cityInput.value = "";
                    townInput.value = "";
                }
            })
            .catch(error => {
                console.error("郵便番号検索エラー:", error);
                alert("住所の取得中にエラーが発生しました");
            });
    });
    
    document.addEventListener("DOMContentLoaded", function () {
        if (document.getElementById("company-list")) {
            getUserLocation(); // ユーザーの位置情報取得後に企業リストを表示
        }
    });
    
    
  // 企業リストをLocalStorageに保存
function saveCompaniesToLocalStorage() {
    const storedCompanies = companies.map(company => ({
        name: company.name,
        duration: company.duration || "未計算"
    }));
    localStorage.setItem("companyData", JSON.stringify(storedCompanies));
}

// `index.html` で企業リストを表示する際にデータを保存
function displayCompanies(userLocation) {
    const container = document.getElementById("company-list");
    if (!container) {
        console.error("企業リストのコンテナが見つかりません。HTML構造を確認してください。");
        return;
    }

    container.innerHTML = ""; // 初期化

    console.log("企業リストを表示:", companies);

    companies.forEach((company) => {
        const card = document.createElement("div");
        card.className = "feature-item";
        card.innerHTML = `
            <h4>${company.name}</h4>
            <p>⚪︎営業時間: ${company.hours}</p>
            <p>⚪︎処分単価: ${company.rate}</p>
            <p>⚪︎住所: ${company.address}</p>
            <p>⚪︎移動時間: ${company.duration || "計算中..."}</p>
            <button onclick="callRequest('${company.phone}')">TEL依頼</button>
        `;
        container.appendChild(card);
    });
    // 企業リストを LocalStorage に保存
    saveCompaniesToLocalStorage();
}

// `crm.html` の `<select id="processing-company">` に企業リストを読み込む
function loadCompaniesToDropdown() {
    const processingCompanySelect = document.getElementById("processing-company");
    if (!processingCompanySelect) {
        console.error("処理会社のセレクトボックスが見つかりません。");
        return;
    }

    const storedCompanies = JSON.parse(localStorage.getItem("companyData")) || [];
    console.log("LocalStorageから読み込んだ企業リスト:", storedCompanies);

    processingCompanySelect.innerHTML = ""; // 初期化

    storedCompanies.forEach(company => {
        const option = document.createElement("option");
        option.value = company.name;
        option.textContent = `${company.name} (${company.duration})`;
        processingCompanySelect.appendChild(option);
    });

    if (storedCompanies.length > 0) {
        document.getElementById("travel-time").value = storedCompanies[0].duration;
    }
}


// `crm.html` 読み込み時に企業リストを反映
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("processing-company")) {
        loadCompaniesToDropdown();
    }
});
  

  // フォームのリセット
  function resetForm() {
    const form = document.getElementById("crm-form");
    if (form && form.tagName === "FORM") {
        form.reset();
    } else {
        document.getElementById("postalcode").value = "";
        document.getElementById("prefecture").value = "";
        document.getElementById("city").value = "";
        document.getElementById("town").value = "";
        document.getElementById("travel-time").value = "";
    }
}

// 案件保存
const saveCase = () => {
    const deadlineValue = deadlineInput.value;
    if (!deadlineValue) {
        alert("期限を入力してください");
        return;
    }

    const caseData = {
        company: processingCompanySelect.value,
        travelTime: travelTimeInput.value,
        postalCode: postalCodeInput.value,
        address: addressInput.value,
        deadline: new Date(deadlineValue).toISOString(), // ISO形式で保存
    };

    // ローカルストレージから案件リストを取得
    const savedCases = JSON.parse(localStorage.getItem("savedCases")) || [];

    // 新しい案件をリストに追加
    savedCases.push(caseData);

    // 期限順に並べ替え
    savedCases.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // ローカルストレージに保存
    localStorage.setItem("savedCases", JSON.stringify(savedCases));

    // 案件リストを再描画
    displaySavedCases(savedCases);

    // プッシュ通知
    showPushNotification("案件を保存しました");
};

// 案件表示
const displaySavedCases = (savedCases) => {
    caseList.innerHTML = ""; // 現在のリストをクリア

    savedCases.forEach((caseData, index) => {
        const caseItem = document.createElement("div");
        caseItem.classList.add("case-item");
        caseItem.innerHTML = `
            <p>会社: ${caseData.company}</p>
            <p>旅行時間: ${caseData.travelTime} 分</p>
            <p>郵便番号: ${caseData.postalCode}</p>
            <p>住所: ${caseData.address}</p>
            <p>回答期限: ${new Date(caseData.deadline).toLocaleDateString()}</p> <!-- 期限を日付形式で表示 -->
            <button class="edit-case" data-index="${index}">編集</button>
            <button class="delete-case" data-index="${index}">削除</button>
        `;
        caseList.appendChild(caseItem);
    });

    // 編集ボタンのクリックイベント
    document.querySelectorAll(".edit-case").forEach((button) => {
        button.addEventListener("click", (event) => editCase(event.target.dataset.index));
    });

    // 削除ボタンのクリックイベント
    document.querySelectorAll(".delete-case").forEach((button) => {
        button.addEventListener("click", (event) => deleteCase(event.target.dataset.index));
    });
};

// 案件編集
const editCase = (index) => {
    const savedCases = JSON.parse(localStorage.getItem("savedCases")) || [];
    const caseData = savedCases[index];

    // フォームに既存のデータをセット
    processingCompanySelect.value = caseData.company;
    travelTimeInput.value = caseData.travelTime;
    postalCodeInput.value = caseData.postalCode;
    addressInput.value = caseData.address;
    deadlineInput.value = caseData.deadline.split("T")[0]; // ISO形式の日付から日付部分をセット

    editingIndex = index;
};

// 案件削除
const deleteCase = (index) => {
    const savedCases = JSON.parse(localStorage.getItem("savedCases")) || [];
    savedCases.splice(index, 1); // 削除
    localStorage.setItem("savedCases", JSON.stringify(savedCases));

    // 案件リストを再描画
    displaySavedCases(savedCases);
};

// プッシュ通知の表示
const showPushNotification = (message) => {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
};
document.addEventListener("DOMContentLoaded", function () {
    const processingCompanySelect = document.getElementById("processing-company");
    const saveCaseButton = document.getElementById("save-case");
    
    if (!processingCompanySelect || !saveCaseButton) {
        console.error("Essential elements are missing");
        return;
    }
    
    // Your saveCase function or other logic here
});
const companyValue = processingCompanySelect.value;
if (!companyValue) {
    console.error("No company selected");
    return;
}



saveCaseButton.addEventListener("click", saveCase);

// 保存された案件の表示
const savedCases = JSON.parse(localStorage.getItem("savedCases")) || [];
displaySavedCases(savedCases);
});