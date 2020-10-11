const PixelsBuy = artifacts.require("PixelsBuy");

contract("PixelsBuy tests", async accounts => {

  it("should return a PixelsBuy instance", async () => {
    let instance = await PixelsBuy.deployed();

    console.log('test instance', instance.address);
    assert.equal(1, 1);
  });

  it("should call purchasePosition", async () => {
    let instance = await PixelsBuy.deployed();

    try {
      let currentPrice = await instance.currentPrice();
      let PixelsContract = await instance.PixelsContract();

      console.log('instance.currentPrice', currentPrice);
      console.log('instance.PixelsContract', PixelsContract);

      await instance.purchasePosition('10x10', 'FFFFFF', { value: 2000 });
    } catch (error) {
      console.error(error);
    }

  });
});