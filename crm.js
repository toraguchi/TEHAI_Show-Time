// 位置情報を取得するフラグ
let hasLocationPermission = false;

// 位置情報取得通知をリロードごとに表示
window.onload = () => {
    // ページが読み込まれるたびに位置情報を取得
    requestLocationPermission();
};

// 位置情報を取得して表示する関数
function getUserLocation() {
    if (navigator.geolocation) {
        // 位置情報取得をリクエスト
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log("位置情報取得成功:", userLocation);
                calculateDistances(userLocation); // 位置情報取得後に距離計算
            },
            (error) => {
                const errorMessages = {
                    1: "位置情報の利用が許可されていません。",
                    2: "位置情報を取得できません。",
                    3: "位置情報の取得がタイムアウトしました。"
                };
                console.error("位置情報取得エラー:", error.message);
                alert(errorMessages[error.code] || "未知のエラーが発生しました。");
            },
            {
                enableHighAccuracy: true, // 高精度な位置情報を取得
                maximumAge: 0 // キャッシュを無効にする
            }
        );
    } else {
        alert("このブラウザは位置情報の取得をサポートしていません。");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const companies = [
        { name: "丸松産業", location: { lat: 35.808179558872375, lng: 139.54994368553108 } },
        { name: "オネスト", location: { lat: 35.645324883816585, lng: 139.83876319650597 } },
        { name: "東港金属", location: { lat: 35.56727553499662, lng: 139.7666577830091 } }
    ];

    const addressInput = document.getElementById("address");


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

    const zipInput = document.createElement("input");
    zipInput.id = "zip";
    zipInput.placeholder = "郵便番号";
    addressInput.parentNode.insertBefore(zipInput, addressInput);

    const processingCompanySelect = document.getElementById("processing-company");

    if (!processingCompanySelect) {
        console.error("processing-company の要素が見つかりません");
        return;
    }

    function getDistance(loc1, loc2) {
        const R = 6371; // 地球の半径 (km)
        const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
        const dLng = (loc2.lng - loc1.lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(2);
    }

    function populateCompanies(userLocation) {
        if (!userLocation || !userLocation.lat || !userLocation.lng) {
            console.error("userLocation が不正です", userLocation);
            return;
        }

        const sortedCompanies = companies.map(company => ({
            ...company,
            distance: getDistance(userLocation, company.location)
        })).sort((a, b) => a.distance - b.distance);

        processingCompanySelect.innerHTML = '<option value="">企業を選択</option>';
        sortedCompanies.forEach(company => {
            const option = document.createElement("option");
            option.value = company.name;
            option.textContent = `${company.name} (${company.distance} km)`;
            processingCompanySelect.appendChild(option);
        });
    }

    function getCoordinatesFromAddress(address) {
        return new Promise((resolve, reject) => {
            if (!address) {
                reject("住所が入力されていません");
                return;
            }

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    const location = results[0].geometry.location;
                    resolve({ lat: location.lat(), lng: location.lng() });
                } else {
                    reject("Geocoding failed: " + status);
                }
            });
        });
    }

    function getAddressFromZip(zip) {
        return new Promise((resolve, reject) => {
            if (!zip) {
                reject("郵便番号が入力されていません");
                return;
            }

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: zip }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    const addressComponents = results[0].address_components;
                    const address = {
                        prefecture: "",
                        city: ""
                    };

                    addressComponents.forEach(component => {
                        if (component.types.includes("administrative_area_level_1")) {
                            address.prefecture = component.long_name;
                        } else if (component.types.includes("locality") || component.types.includes("sublocality")) {
                            address.city = component.long_name;
                        }
                    });

                    resolve(address);
                } else {
                    reject("Geocoding failed: " + status);
                }
            });
        });
    }

    zipInput.addEventListener("blur", function () {
        getAddressFromZip(this.value)
            .then(address => {
                prefectureInput.value = address.prefecture;
                cityInput.value = address.city;
                const fullAddress = `${address.prefecture} ${address.city}`;
                return getCoordinatesFromAddress(fullAddress);
            })
            .then(userLocation => populateCompanies(userLocation))
            .catch(error => console.error("Geocoding failed:", error));
    });

    addressInput.addEventListener("blur", function () {
        const address = `${this.value}`;
        getCoordinatesFromAddress(address)
            .then(userLocation => populateCompanies(userLocation))
            .catch(error => console.error("Geocoding failed:", error));
    });
});