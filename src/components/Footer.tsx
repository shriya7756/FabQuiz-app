const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8 mt-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold">Q</span>
            </div>
            <span className="font-semibold">FabQuiz Quiz Platform</span>
          </div>

          <div className="text-center md:text-left">
            <p className="text-sm opacity-90">© 2025 FabQuiz. All Rights Reserved.</p>
          </div>

          <div className="flex gap-6 text-sm">
            <a href="/feedback" className="hover:opacity-80 transition-opacity">Feedback</a>
            <a href="https://www.linkedin.com/company/microsoft-fabric-user-group-hyderabad/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">LinkedIn</a>
            <a href="https://www.instagram.com/msftfabricughyd/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
