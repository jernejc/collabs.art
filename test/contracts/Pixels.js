const Pixels = artifacts.require("Pixels");

contract("Pixels tests", async accounts => {

  it("should return a Pixels instance", async () => {
    let instance = await Pixels.deployed();
		
		console.log('test instance', instance.address);
    assert.equal(1, 1);
  });
});