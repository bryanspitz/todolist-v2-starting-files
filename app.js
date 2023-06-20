//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { name } = require("ejs");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function run() {
  await mongoose.connect(
    `mongodb+srv://admin-bryanjspitz:${process.env.DB_PASSWORD}@cluster0.jjeup0y.mongodb.net/todolistDB`
  );
  console.log("connected");

  const itemSchema = new mongoose.Schema({
    name: String,
  });

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema],
  });

  const Item = mongoose.model("item", itemSchema);
  const List = mongoose.model("list", listSchema);

  const buy = new Item({ name: "Buy food" });
  const cook = new Item({ name: "Cook food" });
  const eat = new Item({ name: "Eat food" });
  const defaultItems = [buy, cook, eat];

  app.get("/", async (req, res) => {
    const items = await Item.find();

    if (items.length === 0) {
      await Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });

  app.get("/:listName", async (req, res) => {
    const listName = req.params.listName;
    const humanListName = _.startCase(listName);
    const mongoListName = _.camelCase(listName);

    let list = await List.findOne({ name: mongoListName });
    if (!list) {
      list = new List({
        name: mongoListName,
        items: defaultItems,
      });
      list.save;
    }

    res.render("list", { listTitle: humanListName, newListItems: list.items });
  });

  app.post("/", async (req, res) => {
    const item = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({ name: item });

    if (listName === "Today") {
      await newItem.save();
      res.redirect("/");
    } else {
      let list = await List.findOne({ name: _.camelCase(listName) });
      if (!list) {
        list = new List({
          name: _.camelCase(listName),
          items: defaultItems,
        });
      }
      list.items.push(newItem);
      list.save();
      res.redirect(`/${listName}`);
    }
  });

  app.post("/delete", async (req, res) => {
    const id = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      await Item.deleteOne({ _id: id });
      res.redirect("/");
    } else {
      const mongoListName = _.camelCase(listName);
      await List.findOneAndUpdate(
        { name: mongoListName },
        { $pull: { items: { _id: id } } }
      );
      res.redirect(`/${mongoListName}`);
    }
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });

  app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
}

run().catch(console.dir);
