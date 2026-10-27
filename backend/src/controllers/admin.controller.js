const { prisma } = require("../configs/db");

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.users.count();
    const totalNotes = await prisma.notes.count();
    const totalTags = await prisma.tags.count();
    const totalTasks = await prisma.todos.count();
    const totalJournals = await prisma.journals.count();

    res.status(200).json({
      status: "success",
      data: { totalUsers, totalNotes, totalTags, totalTasks, totalJournals },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({ status: "success", data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllNotes = async (req, res) => {
  try {
    const notes = await prisma.notes.findMany({
      include: { tags: true, user: { select: { name: true, email: true } } },
    });

    res.status(200).json({ status: "success", data: notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const changeRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: req.params.id },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const result = await prisma.users.update({
      where: { id: user.id }, // user id that is getting changed, fetched via req.params.id
      data: { role },
    });

    res.status(200).json({
      status: "success",
      message: `${result.name}'s role has been updated to ${result.role}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeUser = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.params.id },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.id === req.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account" });
    }
    await prisma.users.delete({
      where: { id: user.id },
    });

    res
      .status(200)
      .json({ status: "success", message: "User has been removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllNotes,
  changeRole,
  removeUser,
};
