const cheerio = require("cheerio");

const fs = require("fs");

const axios = require("axios");

const writeStream = fs.createWriteStream("products.csv");

//write headers
writeStream.write(`Product Name,   Product Link \n`);

const allProductUrl = "https://sunshinemall.vn/collections/all";

let product_data = [];

const getProductById = (productLink) =>
  new Promise(async (resolve, reject) => {
    try {
      //fetch the markup
      const { data } = await axios.get(`https://sunshinemall.vn${productLink}`);

      //load the markup
      const $ = cheerio.load(data);

      // initiate product data object
      let productDataObj = {};

      // danh sách ảnh thumb
      let productThumb = [];

      // Lấy danh sách ảnh thumb của product
      $(".thumb_img").each((index, el) => {
        // lấy tên sản phẩm
        const productThumb = $(el)
          .find(".product-thumb a img")
          .attr("src")
          .split(" ");

        productThumb.push(`${productThumb},\n`);
      });

      // lấy tên hãng
      const productBrand = $(".product-detail-box")
        .find(".product-subtitle")
        .text()
        .replace(/\s\s+/g, "");

      // lấy tên sản phẩm
      const productName = $(".product-detail-box")
        .find(".product-title")
        .text()
        .replace(/\s\s+/g, "");

      // lấy mã sản phẩm
      const productCode = $(".product-detail-box")
        .find(".sku strong")
        .next()
        .text()
        .replace(/\s\s+/g, "");

      // lấy giá gốc sản phẩm
      const productOriginalPrice = $(".price")
        .find("span img")
        .text()
        .replace(/\s\s+/g, "");

      // lấy giá sản phẩm mới
      const productDiscountPrice = $(".price")
        .find(".current")
        .text()
        .replace(/\s\s+/g, "");

      // lấy chi tiết sản phẩm (danh sách ảnh)
      let productDetailImgList = [];

      $(".tab1").each((index, el) => {
        // lấy ảnh chi tiết từng sản phẩm
        const productItemImg = $(el).find("span img").attr("src").split(" ");
        productDetailImgList.push(`${productItemImg},\n`);
      });

      productDataObj["productBrand"] = productBrand;
      productDataObj["productName"] = productName;
      productDataObj["productThumb"] = productThumb;
      productDataObj["productCode"] = productCode;
      productDataObj["productOriginalPrice"] = productOriginalPrice;
      productDataObj["productDiscountPrice"] = productDiscountPrice;
      productDataObj["productDetailImgList"] = productDetailImgList;

      writeStream.write(
        ` Product Brand: ${productBrand}, \n  Product Name : ${productName}  \n 
          Product Thumb: ${productThumb}, \n  Product Code : ${productCode}  \n ===
          Product Original Price: ${productOriginalPrice}, \n  Product Discount Price : ${productDiscountPrice} \n ===
          Product Thumb: ${productDetailImgList}, \n ===
      `
      );
      resolve(productDataObj);
    } catch (err) {
      reject(err);
    }
  });

const getAllProducts = async (url) => {
  try {
    //fetch the markup
    const { data } = await axios.get(url);

    //load the markup
    const $ = cheerio.load(data);

    // all links to crawl product detail
    let allUrls = [];

    // Loop through product item
    $(".item_product").each((index, el) => {
      // lấy link để cào chi tiết sản phẩm
      const [productLink] = $(el).find(".chir-img a").attr("href").split(" ");
      allUrls.push(productLink);
      //   if (productLink)
    });

    for (link in allUrls) {
      let currentPageData = await getProductById(allUrls[link]);
      product_data.push(currentPageData);
    }

    // lấy sản phẩm trang tiếp theo
    if ($(".pagination_next a").length > 0) {
      next_page =
        "https://sunshinemall.vn" +
        $(".pagination_next a").attr("href").split(" ");
      getAllProducts(next_page);
    }
  } catch (error) {
    console.log(error);
  }
};

getAllProducts(allProductUrl);

module.exports = {
  getProductById,
  getAllProducts,
};
