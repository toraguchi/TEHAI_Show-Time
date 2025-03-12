document.addEventListener("DOMContentLoaded", function () {
    const caseList = document.getElementById("case-list");
    const processingCompanySelect = document.getElementById("processing-company");
    const saveCaseButton = document.getElementById("save-case");
    const formContainer = document.getElementById("crm-form");
    const travelTimeInput = document.getElementById("travel-time");
    const postalCodeInput = document.getElementById("postalcode");
    const deadlineInput = document.getElementById("deadline"); // 回答期限入力
    const addressInput = document.getElementById("address");
    const customerNameInput = document.getElementById("customer-name");
    const estimateDateInput = document.getElementById("estimate-date");
    const priceInput = document.getElementById("price");
    const statusSelect = document.getElementById("status");
    const phoneNumberInput = document.getElementById("phone-number");

    if (!processingCompanySelect) {
        console.error("Processing company select element not found");
        return; // Prevent further execution if the element doesn't exist
    }

    if (!saveCaseButton) {
        console.error("Save case button not found");
        return; // Prevent further execution if the button doesn't exist
    }

    // 編集モードでページが読み込まれた場合、案件の内容を反映
    const editCaseIndex = localStorage.getItem("editCaseIndex");
    if (editCaseIndex !== null) {
        const savedCases = JSON.parse(localStorage.getItem("cases")) || [];
        const caseToEdit = savedCases[editCaseIndex];

        if (caseToEdit) {
            customerNameInput.value = caseToEdit.customerName;
            postalCodeInput.value = caseToEdit.postalCode;
            addressInput.value = caseToEdit.address;
            prefectureInput.value = caseToEdit.prefecture;
            cityInput.value = caseToEdit.city;
            townInput.value = caseToEdit.town;
            phoneNumberInput.value = caseToEdit.phoneNumber;
            estimateDateInput.value = caseToEdit.estimateDate;
            priceInput.value = caseToEdit.price;
            deadlineInput.value = caseToEdit.deadline;
            statusSelect.value = caseToEdit.status;
            processingCompanySelect.value = caseToEdit.company;
            travelTimeInput.value = caseToEdit.travelTime;

            formContainer.dataset.editIndex = editCaseIndex;
            localStorage.removeItem("editCaseIndex"); // 編集モードを解除
            formContainer.style.display = "block"; // フォームを表示
            saveCaseButton.textContent = "更新"; // ボタンのテキストを更新に変更
        }
    }

    // 案件作成ボタンを押すとフォームを開く
    document.getElementById("create-case-location").addEventListener("click", function() {
        resetForm();
        formContainer.style.display = "block"; // フォームを表示
        saveCaseButton.textContent = "保存"; // ボタンのテキストを保存に変更
    });

    // 保存ボタンのクリックイベント
    saveCaseButton.addEventListener("click", function() {
        const deadlineValue = deadlineInput.value;

        const caseData = {
            customerName: customerNameInput.value || "ー",
            estimateDate: estimateDateInput.value || "ー",
            prefecture: prefectureInput.value || "ー",
            city: cityInput.value || "ー",
            town: townInput.value || "ー",
            company: processingCompanySelect.value || "ー",
            travelTime: travelTimeInput.value || "ー",
            postalCode: postalCodeInput.value || "ー",
            address: addressInput.value || "ー",
            price: priceInput.value || "ー",
            status: statusSelect.value || "ー",
            phoneNumber: phoneNumberInput.value || "ー",
            deadline: deadlineValue ? new Date(deadlineValue).toISOString().split('T')[0] : "ー", // 日付だけを保存
        };

        // ローカルストレージから案件リストを取得
        const savedCases = JSON.parse(localStorage.getItem("cases")) || [];

        if (formContainer.dataset.editIndex !== undefined) {
            // 既存の案件を更新
            const editIndex = formContainer.dataset.editIndex;
            savedCases[editIndex] = caseData;
            delete formContainer.dataset.editIndex; // 編集モードを解除
        } else {
            // 新しい案件をリストに追加
            savedCases.unshift(caseData); // 新しい案件を一番上に追加
        }

        // ローカルストレージに保存
        localStorage.setItem("cases", JSON.stringify(savedCases));

        // 案件リストを再描画
        displaySavedCases(savedCases);

        // プッシュ通知
        showPushNotification("案件を保存しました");

        // フォームをリセット
        resetForm();

        // サーバーにデータを保存
        saveCasesToServer(savedCases);
    });

// 案件表示
const displaySavedCases = (savedCases) => {
    caseList.innerHTML = ""; // 現在のリストをクリア

    caseList.innerHTML = `
    <div class="case-header">
        <span>No.</span>
        <span>お客様名</span>
        <span>電話番号</span>
        <span>住所</span>
        <span>見積もり日</span>
        <span>回答期限</span>
        <span>ステータス</span>
        <span>代金</span>
        <span>中間処理企業</span>
        <span>移動時間</span>
        <span>操作</span>
    </div>
    `;

    savedCases.forEach((caseItem, index) => {
        const caseElement = document.createElement("div");
        caseElement.className = "case-item";
        caseElement.innerHTML = `
            <span>${savedCases.length - index}</span>
            <span>${caseItem.customerName}</span>
            <span>${caseItem.phoneNumber}</span>
            <span>${caseItem.prefecture} ${caseItem.city} ${caseItem.town}</span>
            <span>${caseItem.estimateDate}</span>
            <span>${caseItem.deadline}</span>
            <span>${caseItem.status}</span>
            <span>${caseItem.price}</span>
            <span>${caseItem.company}</span>
            <span>${caseItem.travelTime}</span>
            <span>
                    <button class="edit-case" data-index="${index}">編集</button>
                    <button class="delete-case" data-index="${index}">削除</button>
                </span>
            `;

            // ステータスに応じてハイライト
            if (caseItem.status === "成約") {
                caseElement.style.backgroundColor = "#ADD8E6"; // 水色
            } else if (caseItem.status === "不成約") {
                caseElement.style.backgroundColor = "#FFC0CB"; // ピンク色
            } else if (caseItem.status === "検討中") {
                caseElement.style.backgroundColor = "#FFFACD"; // 薄黄色
            }

            caseList.appendChild(caseElement);
        });

        // 編集ボタンのクリックイベント
        document.querySelectorAll(".edit-case").forEach((button) => {
            button.addEventListener("click", (event) => {
                resetForm();
                editCase(event.target.dataset.index);
                formContainer.style.display = "block"; // フォームを表示
                saveCaseButton.textContent = "更新"; // ボタンのテキストを更新に変更
            });
        });

        // 削除ボタンのクリックイベント
        document.querySelectorAll(".delete-case").forEach((button) => {
            button.addEventListener("click", (event) => {
                if (confirm("削除でお間違え無いですか？")) {
                    deleteCase(event.target.dataset.index);
                }
            });
        });
        // 案件削除
const deleteCase = (index) => {
    const savedCases = JSON.parse(localStorage.getItem("cases")) || [];
    savedCases.splice(index, 1);

    // ローカルストレージに保存
    localStorage.setItem("cases", JSON.stringify(savedCases));

    // 案件リストを再描画
    displaySavedCases(savedCases);

    // サーバーにデータを保存
    saveCasesToServer(savedCases);
};
    };

    // 案件編集
    const editCase = (index) => {
        const savedCases = JSON.parse(localStorage.getItem("cases")) || [];
        const caseData = savedCases[index];

        if (!caseData) {
            console.error("案件データが見つかりません");
            return;
        }

        customerNameInput.value = caseData.customerName;
        postalCodeInput.value = caseData.postalCode;
        addressInput.value = caseData.address;
        prefectureInput.value = caseData.prefecture;
        cityInput.value = caseData.city;
        townInput.value = caseData.town;
        phoneNumberInput.value = caseData.phoneNumber;
        estimateDateInput.value = caseData.estimateDate;
        priceInput.value = caseData.price;
        deadlineInput.value = caseData.deadline;
        statusSelect.value = caseData.status;
        processingCompanySelect.value = caseData.company;
        travelTimeInput.value = caseData.travelTime;

        formContainer.dataset.editIndex = index;
        formContainer.style.display = "block";
    };

    // プッシュ通知の表示
    const showPushNotification = (message) => {
        if (Notification.permission === "granted") {
            new Notification(message);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(message);
                }
            });
        }
    };

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
        formContainer.style.display = "none";
    }

    // サーバーにデータを保存する関数
    const saveCasesToServer = (cases) => {
        fetch('https://35.190.238.250/api/saveCases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cases)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('サーバーにデータが保存されました:', data);
        })
        .catch(error => {
            console.error('サーバーへのデータ保存中にエラーが発生しました:', error);
            alert('サーバーへのデータ保存中にエラーが発生しました。詳細はコンソールを確認してください。');
        });
    };
    // 保存された案件の表示
    const savedCases = JSON.parse(localStorage.getItem("cases")) || [];
    displaySavedCases(savedCases);

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

document.getElementById("create-case-location").addEventListener("click", function() {
});


const companies = [
    { name: "丸松産業", location: { lat: 35.808179558872375, lng: 139.54994368553108 } },
    { name: "オネスト", location: { lat: 35.645324883816585, lng: 139.83876319650597 } },
    { name: "東港金属", location: { lat: 35.56727553499662, lng: 139.7666577830091 } }
    // 他の会社データもここに追加
];

function getTravelTime(origin, destination, callback) {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
        if (status === google.maps.DistanceMatrixStatus.OK) {
            const result = response.rows[0].elements[0];
            callback(result.duration.text, result.duration.value); // 移動時間をテキストと値で返す
        } else {
            console.error("Distance Matrix APIのエラー:", status);
            callback(null, null);
        }
    });
}

function populateCompanies(userLocation) {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
        console.error("userLocation が不正です", userLocation);
        return;
    }

    const origin = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    processingCompanySelect.innerHTML = '<option value="">企業を選択</option>';

    const companyPromises = companies.map(company => {
        return new Promise((resolve) => {
            const destination = new google.maps.LatLng(company.location.lat, company.location.lng);
            getTravelTime(origin, destination, function(travelTimeText, travelTimeValue) {
                resolve({
                    ...company,
                    travelTimeText,
                    travelTimeValue
                });
            });
        });
    });

    Promise.all(companyPromises).then(sortedCompanies => {
        sortedCompanies.sort((a, b) => a.travelTimeValue - b.travelTimeValue);
        sortedCompanies.forEach(company => {
            const option = document.createElement("option");
            option.value = company.name;
            option.textContent = `${company.name} (${company.travelTimeText})`;
            processingCompanySelect.appendChild(option);
        });
    });
}

    function geocodeAddress(address, callback) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, function(results, status) {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                callback({ lat: location.lat(), lng: location.lng() });
            } else {
                console.error("Geocode was not successful for the following reason: " + status);
                alert("住所のジオコーディングに失敗しました");
            }
        });
    }

    postalCodeInput.addEventListener("blur", function () {
        const postalCode = postalCodeInput.value.trim();
        if (!postalCode) return;

        fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200 && data.results) {
                    const result = data.results[0];
                    prefectureInput.value = result.address1.trim(); // 都道府県
                    cityInput.value = (result.address2 + (result.address3 || "")).trim(); // 市区町村 + 町名を統合
                    townInput.value = ""; // 番地・建物名は手入力

                    const fullAddress = `${prefectureInput.value} ${cityInput.value}`;
                    geocodeAddress(fullAddress, populateCompanies);
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

    let editingIndex = null;

    saveCaseButton.addEventListener("click", function() {
        if (!processingCompanySelect.value) {
            console.error("No company selected");
            alert("案件を保存する前に会社を選択してください。");
            return;
        }
});

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
                            populateCompanies(approximateLocation);
                        }
                    });
                },
                function (error) {
                    console.error("位置情報の取得に失敗しました:", error);
                    alert("現在地を取得できませんでした。位置情報の許可を確認してください。");
                }
            );
        }
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
                            cityTown = component.long_name + " " + cityTown; // 市区町村＋町名
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

                    // 住所が反映された時点で会社を表示
                    const fullAddress = `${prefecture} ${cityTown}`;
                    geocodeAddress(fullAddress, function(location) {
                        populateCompanies(location);
                    });
                } else {
                    console.error("住所の取得に失敗しました");
                }
            })
            .catch(error => {
                console.error("ジオコーディングのエラー:", error);
            });
    }

    function geocodeAddress(address, callback) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, function(results, status) {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                callback({ lat: location.lat(), lng: location.lng() });
            } else {
                console.error("Geocode was not successful for the following reason: " + status);
                alert("住所のジオコーディングに失敗しました");
            }
        });
    }
    
    // 会社選択時に移動時間を自動反映
    processingCompanySelect.addEventListener("change", function() {
        const selectedCompany = companies.find(company => company.name === processingCompanySelect.value);
        if (selectedCompany) {
            const fullAddress = `${prefectureInput.value} ${cityInput.value} ${townInput.value}`;
            if (!fullAddress.trim()) {
                alert("住所を入力してください");
                return;
            }
    
            geocodeAddress(fullAddress, function(userLocation) {
                const destination = new google.maps.LatLng(selectedCompany.location.lat, selectedCompany.location.lng);
                getTravelTime(userLocation, destination, function(travelTimeText) {
                    travelTimeInput.value = travelTimeText;
                });

            });
        }
    });
    });